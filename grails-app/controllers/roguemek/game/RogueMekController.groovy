package roguemek.game

import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*
import roguemek.*
import roguemek.model.*

@Transactional
class RogueMekController {
	
	transient springSecurityService
	
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
	        params.max = Math.min(max ?: 10, 100)
			params.sort = params.sort ?: "description"
			params.order = params.order ?: "asc"
			def gameCriteria = Game.createCriteria()
			def initGames = gameCriteria.list(max: params.max, offset: params.offset) {
				and {
					eq("gameState", Game.GAME_INIT)
				}
				order(params.sort, params.order)
			}
	        respond initGames, model:[gameInstanceCount: initGames.getTotalCount()]
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
		}
		
		if(gameInstance.board == null) {
			BattleHexMap battleMap = new BattleHexMap()
			battleMap.save flush:true
			
			gameInstance.board = battleMap
		}
		
		gameInstance.ownerUser = userInstance
		gameInstance.validate()

		if (gameInstance.hasErrors()) {
			respond gameInstance.errors, view:'create'
			return
		}

		gameInstance.save flush:true

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
		}
		
		// delete any staging data
		def stagingUsers = []
		for(def stageUser in gameInstance.stagingUsers) {
			stagingUsers.add(stageUser)
		}
		gameInstance.stagingUsers = []
		for(StagingUser stageUser in stagingUsers) {
			stageUser.delete flush:true
		}
		
		BattleHexMap battleMap = gameInstance.board
		
		gameInstance.delete flush:true
		battleMap.delete flush:true
	
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
