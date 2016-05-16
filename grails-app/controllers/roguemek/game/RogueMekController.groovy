package roguemek.game

import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*

import roguemek.*
import roguemek.chat.*
import roguemek.model.*
import roguemek.stats.*

@Transactional
class RogueMekController {
	
	transient springSecurityService
	def grailsApplication
	
	def gameChatService
	def gameStagingService
	
	@Transactional(readOnly = true)
	def index() {
		def userInstance = currentUser()
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect url: "/"
		}
	}
	
	/**
	 * Makes sure the authenticated user can play the provided game and pilot instances, 
	 * then forwards to the game with them in the session
	 */
	@Transactional(readOnly = true)
	def startBattle() {
		def user = currentUser()
		
		// TODO: make sure the user has a pilot in the game (it can be attached to the game even without a unit)
		def game = Game.get(params.game)
		
		if(game != null) {
			session["game"] = game.id
			session["user"] = user.id
			
			redirect controller: 'game'
		}
		else {
			redirect mapping:"dropship"
		}
	}
	
	/**
	 * Generates the info needed to join a battle
	 * @return
	 */
	@Transactional(readOnly = true)
	def join(Integer max) {
		def userInstance = currentUser()
		if(userInstance) {
			String specialSort
			if(["CHAT_USERS", "STAGING_USERS"].contains(params.sort)) {
				// handle some special sorting options that aren't directly mapped to the Game domain
				specialSort = params.sort
				params.sort = null
			}
			
	        params.max = Math.min(max ?: 10, 100)
			params.sort = params.sort ?: "startDate"
			params.order = params.order ?: "desc"
			
			def gameCriteria = Game.createCriteria()
			def initGames = gameCriteria.list(max: params.max, offset: params.offset) {
				and {
					eq("gameState", Game.GAME_INIT)
					eq("privateGame", false)
				}
				order(params.sort, params.order)
			}
			
            def gameChatUserCount = [:]
            def stagingUserCount = [:]
            
            if(initGames.getTotalCount() > 0) {
                // retrieve the total active chat users connected to each game
                def chatUserCriteria = GameChatUser.createCriteria()
                def gameChatUserCountList = chatUserCriteria.list {
                    projections {
                        groupProperty("game")
                        countDistinct("chatUser")
                    }
                    'in'("game", initGames)
                }
                // map the result list by game instance
                gameChatUserCountList.each { resultRow ->
                    def resultGame = resultRow[0]
                    def resultCount = resultRow[1]
                    gameChatUserCount[resultGame] = resultCount
                }
                
                // retrieve the total staging users connected to each game
                def stagingUserCriteria = StagingUser.createCriteria()
                def stagingUserCountList = stagingUserCriteria.list {
                    projections {
                        groupProperty("game")
                        countDistinct("user")
                    }
                    'in'("game", initGames)
                }
                // map the result list by game instance
                stagingUserCountList.each { resultRow ->
                    def resultGame = resultRow[0]
                    def resultCount = resultRow[1]
                    stagingUserCount[resultGame] = resultCount
                }
            }
			
			if(specialSort) {
				// re-sort the initGames list based on the special sorting
				boolean ascending = (params.order == "asc")
				def specialSortMap
				if(specialSort == "CHAT_USERS") {
					specialSortMap = gameChatUserCount
					
					initGames.sort { g1, g2 ->
						(gameChatUserCount[g1] ?: 0) <=> (gameChatUserCount[g2] ?: 0)
					}
				}
				else if(specialSort == "STAGING_USERS") {
					specialSortMap = stagingUserCount
					
					initGames.sort { g1, g2 ->
						(stagingUserCount[g1] ?: 0) <=> (stagingUserCount[g2] ?: 0)
					}
				}
				
				if(specialSortMap) {
					if(ascending) {
						initGames.sort { g1, g2 ->
							(specialSortMap[g1] ?: 0) <=> (specialSortMap[g2] ?: 0)
						}
					}
					else {
						initGames.sort { g2, g1 ->
							(specialSortMap[g1] ?: 0) <=> (specialSortMap[g2] ?: 0)
						}
					}
				}
			
				// put the special sorting back in params so it appears in the rendered view properly
				params.sort = specialSort
			}
			
	        respond initGames, model:[gameInstanceCount: initGames.getTotalCount(), 
										gameChatUserCount: gameChatUserCount, 
										stagingUserCount: stagingUserCount]
		}
		else {
			redirect action: 'index'
		}
    }
	
	/**
	 * Shows the abort confirmation page
	 * @param game
	 * @return
	 */
	@Transactional(readOnly = true)
	def abort(Game game) {
		def userInstance = currentUser()
		if(!userInstance) {
			redirect action: 'index'
		}
		
		if(game == null || !game.isInit()) {
			// TODO: allow a game to be aborted while in progress?
			redirect mapping:"dropship"
		}
		else if(game.ownerUser != userInstance) {
			redirect mapping: "stagingGame", id: game.id
		}
		else {
			respond game
		}
	}
	
	/**
	 * Shows the game debriefing page
	 * @param game
	 * @return
	 */
	@Transactional(readOnly = true)
	def debrief(Game game) {
		// only show debriefing if the game is actually over
		if(game == null || !game.isOver()) {
			redirect mapping:"dropship"
		}
		else{
			// load some tables and maps to help display the game result data
			def winners = []
			def killMap = [:]	// [key: MekUser, value: [KillDeath,...],...]
			
			def unitsByUser = game?.getUnitsByUser(true)
			
			// show winners first on the page
			def winsLosses = WinLoss.findAllByGame(game)
			winsLosses.each { WinLoss thisWL ->
				if(thisWL.winner) {
					winners << thisWL.user.id
				}
			}
			
			// load a map for easy access to the info by user
			def killsDeaths = KillDeath.findAllByGame(game)
			killsDeaths.each { KillDeath thisKD ->
				if(thisKD.killer) {
					def killList = killMap[thisKD.killer.id]
					if(killList == null) {
						killList = []
						killMap[thisKD.killer.id] = killList
					}
					
					killList << thisKD
				}
			}
			
			// load chat messages
			def chatMessages = ChatMessage.findAllByOptGameId(game?.id, [sort: "time", order: "asc"])
			
			// load users grouped and identified with their team
			def usersByTeam = game?.getUsersByTeam()
			
			log.info "usersByTeam: ${usersByTeam}"
			
			respond game, model: [winners: winners, killMap: killMap, chatMessages: chatMessages, 
					usersByTeam: usersByTeam, unitsByUser: unitsByUser]
		}
	}
	
	/**
	 * Allows the game owner only to delete the game instance
	 * @param gameInstance
	 * @return
	 */
	def delete(Game gameInstance) {
		
		if (gameInstance == null || !gameInstance.isInit()) {
			notFound()
			return
		}
		
		def userInstance = currentUser()
		if(!userInstance || gameInstance.ownerUser != userInstance) {
			redirect mapping:"dropship"
			return
		}
		
		gameStagingService.deleteGame(gameInstance)
		
		request.withFormat {
			form multipartForm {
				flash.message = message(code: 'default.deleted.message', args: [message(code: 'battle.label', default: 'Battle'), gameInstance.description])
				redirect mapping:"dropship", method:"GET"
			}
			'*'{ render status: NO_CONTENT }
		}
	}
	
	private MekUser currentUser() {
		return MekUser.get(springSecurityService.principal.id)
	}
	
	protected void notFound() {
		request.withFormat {
			form multipartForm {
				flash.message = message(code: 'default.not.found.message', args: [message(code: 'game.label', default: 'Game'), params.id])
				redirect action: "index", method: "GET"
			}
			'*'{ render status: NOT_FOUND }
		}
	}
}
