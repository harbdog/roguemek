package roguemek.game

import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*
import roguemek.*
import roguemek.model.*

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
	 * Generates the info needed to create a new battle
	 * @return
	 */
	@Transactional(readOnly = true)
	def create() {
		def userInstance = currentUser()
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect action: 'index'
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
			params.sort = params.sort ?: "description"
			params.order = params.order ?: "asc"
			
			def gameCriteria = Game.createCriteria()
			def initGames = gameCriteria.list(max: params.max, offset: params.offset) {
				and {
					eq("gameState", Game.GAME_INIT)
					eq("privateGame", false)
				}
				order(params.sort, params.order)
			}
			
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
			def gameChatUserCount = [:]
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
			def stagingUserCount = [:]
			stagingUserCountList.each { resultRow ->
				def resultGame = resultRow[0]
				def resultCount = resultRow[1]
				stagingUserCount[resultGame] = resultCount
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
			respond game
		}
	}
	
	/**
	 * Creates the new battle as initializing
	 * @param gameInstance
	 * @return
	 */
	def saveCreate(Game gameInstance) {
		if (gameInstance == null) {
			notFound()
			return
		}
		
		def userInstance = currentUser()
		if(!userInstance) {
			redirect action: 'index'
			return
		}
		
		if(gameInstance.board == null) {
			BattleHexMap battleMap = new BattleHexMap(game: gameInstance)
			gameInstance.board = battleMap
		}
		
		gameInstance.ownerUser = userInstance
		gameInstance.users = [userInstance]
		gameInstance.validate()
		
		// make sure the user creating the battle doesn't already own too many games in staging
		int userStagingLimit = grailsApplication.config.roguemek.game.settings.userStagingLimit ?: 3
		def usersStagingGames = Game.findAllByOwnerUserAndGameState(userInstance, Game.GAME_INIT)
		if(usersStagingGames.size() >= userStagingLimit) {
			gameInstance.errors.reject('error.user.too.many.staging.games', [userStagingLimit] as Object[], '[You have too many games, limit is [{0}]')
			respond gameInstance.errors, view:'create'
			return
		}

		if (gameInstance.hasErrors()) {
			respond gameInstance.errors, view:'create'
			return
		}

		gameInstance.save flush:true
		
		// generate staging information for the owner user
		gameStagingService.generateStagingForUser(gameInstance, userInstance)

		request.withFormat {
			form multipartForm {
				flash.message = message(code: 'default.created.message', args: [message(code: 'battle.label', default: 'Battle'), gameInstance.description])
				redirect mapping: 'stagingGame', id: gameInstance.id
			}
			'*' { respond gameInstance, [status: CREATED] }
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
