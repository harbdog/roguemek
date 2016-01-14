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
	 * Shows the game staging page
	 * @return
	 */
	@Transactional(readOnly = true)
	def staging(Game game) {
		def userInstance = currentUser()
		if(!userInstance) {
			redirect action: 'index'
		}
		
		if(game == null) {
			redirect mapping:"dropship"
		}
		else if(game.isOver()) {
			redirect mapping: "debriefGame", id: game.id
		}
		else {
			session["game"] = game.id
			
			respond game, model:[userInstance:userInstance]
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
	@Secured(['ROLE_USER'])
	def delete(Game gameInstance) {
		
		if (gameInstance == null || !gameInstance.isInit()) {
			notFound()
			return
		}
		
		def userInstance = currentUser()
		if(!userInstance || gameInstance.ownerUser != userInstance) {
			redirect mapping:"dropship"
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
	
	/**
	 * Gets names and information about the available maps
	 * @respond object containing the names and info about each map
	 */
	def mapSelect() {
		def userInstance = currentUser()
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect url: "/"
		}
	}
	
	/**
	 * Updates the selected map for a game
	 * @return
	 */
	def mapUpdate() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// map can only be updated in the Init stage
		Game game = Game.get(session.game)
		if(game == null || !game.isInit()) return
		
		// make sure only the game owner can update the map
		if(game.ownerUser != userInstance) return
		
		if(params.mapId == null) return
		HexMap map = HexMap.get(params.mapId)
		if(map == null) return
		
		BattleHexMap b = game.board
		b.map = map
		b.validate()
		
		if(b.hasErrors()) {
			render b.errors
			return
		}
		
		b.save flush:true
		
		b.loadMap()
		
		def result = [updated:true]
		render result as JSON
	}
	
	/**
	 * Gets names and information about the available units
	 * @respond object containing the names and info about each unit
	 */
	def unitSelect() {
		def userInstance = currentUser()
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect url: "/"
		}
	}
	
	/**
	 * Adds the selected unit to the game
	 * @return
	 */
	def addUnit() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// units can only be updated in the Init stage
		Game game = Game.get(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.unitId == null) return
		Unit unitInstance = Unit.get(params.unitId)
		if(unitInstance == null) return
		
		// create the BattleUnit instance to load into the game
		BattleUnit battleUnitInstance
		if(unitInstance instanceof Mech) {
			// TODO: create pilots with random names, but eventually show pilot selection to player
			def testPilot = new Pilot(firstName: Name.getRandom().name, lastName: Surname.getRandom().surname, ownerUser: userInstance, status: Pilot.STATUS_ACTIVE)
			testPilot.save flush: true
			
			// TODO: set the unit color to the color selected by the player
			battleUnitInstance = new BattleMech(pilot: testPilot, mech: unitInstance, x: 0, y: 0, heading: 3, rgb: [255, 255, 255])
		}
		
		if(battleUnitInstance == null) return
		
		if(!battleUnitInstance.validate()) {
			log.error("Errors with battle unit "+battleUnitInstance.mech?.name+":\n")
			battleUnitInstance.errors.allErrors.each {
				log.error(it)
			}
			
			return
		}
		else {
			battleUnitInstance.save flush:true
		
			log.info('Initialized battle unit '+battleUnitInstance.mech?.name+" with ID="+battleUnitInstance.id)
		}
		
		game.units.add(battleUnitInstance)
		
		if(game.hasErrors()) {
			render game.errors
			return
		}
		
		game.save flush:true
		
		def result = [updated:true]
		render result as JSON
	}
	
	/**
	 * Removes the selected unit from the game
	 * @return
	 */
	def removeUnit() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// units can only be updated in the Init stage
		Game game = Game.get(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.unitId == null) return
		BattleUnit unitInstance = BattleUnit.get(params.unitId)
		if(unitInstance == null) return
		
		// make sure only the unit owner can remove the unit
		if(!unitInstance.isUsedBy(userInstance)) return
		
		game.units.remove(unitInstance)
		
		if(game.hasErrors()) {
			render game.errors
			return
		}
		
		game.save flush:true
		
		// TODO: remove the BattleUnit from the database, if it is not owned (also remove the pilot if not owned)
		
		def result = [updated:true]
		render result as JSON
	}
	
	/**
	 * Adds the current User to the game
	 * @return
	 */
	def addUser() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// users can only be updated in the Init stage
		Game game = Game.get(session.game)
		if(game == null || !game.isInit()) return
		
		if(!game.users.contains(userInstance)){
			game.users.add(userInstance)
			
			if(game.hasErrors()) {
				render game.errors
				return
			}
			
			game.save flush:true
		}
		
		def result = [updated:true]
		render result as JSON
	}
	
	/**
	 * Removes the selected user from the game
	 * @return
	 */
	def removeUser() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// users can only be updated in the Init stage
		Game game = Game.get(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToRemove = MekUser.read(params.userId)
		if(userToRemove == null) return
		
		// make sure only the user or the game owner can remove the user
		if(userInstance != game.ownerUser && userInstance != userToRemove) return

		game.users.remove(userToRemove)
		
		// remove any of the user's units from the game also
		def unitsToRemove = []
		for(BattleUnit unitInstance in game.units) {
			if(unitInstance.isUsedBy(userToRemove)) {
				unitsToRemove << unitInstance
			}
		}
		
		unitsToRemove.each { unitInstance ->
			game.units.remove(unitInstance)
		}
		
		if(game.hasErrors()) {
			render game.errors
			return
		}
		
		game.save flush:true
		
		def result = [updated:true]
		render result as JSON
	}
	
	/**
	 * Updates the starting location of the user
	 * @return
	 */
	def locationUpdate() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		String startingLocation = params.location
		if(startingLocation == null || !Game.STARTING_LOCATIONS.contains(startingLocation)) return
		
		// users can only be updated in the Init stage
		Game game = Game.get(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToUpdate = MekUser.read(params.userId)
		if(userToUpdate == null) return
		
		// make sure only the user or the game owner can update the user
		if(userInstance != game.ownerUser && userInstance != userToUpdate) return
		
		def locationUpdated = game.setStartingLocationForUser(userToUpdate, startingLocation)
		
		def result = [updated:locationUpdated]
		render result as JSON
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
