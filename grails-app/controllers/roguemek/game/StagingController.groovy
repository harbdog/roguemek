package roguemek.game

import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*
import roguemek.*
import roguemek.chat.*
import roguemek.model.*

@Transactional
class StagingController {

	transient springSecurityService
	def grailsApplication
	
	def gameChatService
	def gameStagingService
	
	@Transactional(readOnly = true)
	def index() {
		redirect url: "/"
	}
	
    /**
	 * Shows the game staging page and joins the game if possible
	 * @return
	 */
	def staging(Game game) {
		def userInstance = currentUser()
		if(!userInstance) {
			redirect action: 'index'
		}
		
		boolean isParticipant = false
		StagingUser stagingInstance
		
		if(game == null) {
			redirect mapping:"dropship"
			return
		}
		else if(game.isOver()) {
			redirect mapping: "debriefGame", id: game.id
			return
		}
		else if(game.isActive()) {
			isParticipant = game.isParticipant(userInstance)
		}
		else {
			stagingInstance = StagingUser.findByGameAndUser(game, userInstance)
			isParticipant = (stagingInstance != null)
		}
		
		if(isParticipant) {
			// nothing to do, let user proceed
		}
		else {
			// user is not a participant and likely intends to join if init
			if(game.isActive()) {
				redirect mapping:"dropship"
				return
			}
			
			// generate staging information for the new user
			stagingInstance = gameStagingService.generateStagingForUser(game, userInstance)
			
			def data = [
				user: userInstance.id,
				userAdded: userInstance.id
			]
			Object[] messageArgs = [userInstance.toString()]
			gameChatService.addMessageUpdate(game, "staging.user.added", messageArgs)
			
			gameStagingService.addStagingUpdate(game, data)
		}
		
		def stagingUsers = StagingUser.findAllByGame(game)
		def chatUsers = GameChatUser.executeQuery(
				'select u.chatUser from GameChatUser u where u.game=:game',
				[game: game]
		)
		def chatMessages = ChatMessage.findAllByOptGameId(game.id, [max: 100, sort: "time", order: "asc"])
		
		session["game"] = game.id
		
		respond game, model:[userInstance:userInstance, 
				stagingUsers:stagingUsers, stagingInstance:stagingInstance, 
				chatUsers:chatUsers, chatMessages:chatMessages]
	}
	
	/**
	 * Leaves the game, removing the user from it
	 */
	def leave(Game game) {
		def userInstance = currentUser()
		if(!userInstance || !game) {
			redirect action: 'index'
			return
		}
		
		StagingUser stagingInstance = StagingUser.findByGameAndUser(game, userInstance)
		if(stagingInstance) {
			stagingInstance.delete flush:true
			
			// TODO: remove any of the user's BattleUnit from the database, if it is not owned (also remove the pilot if not owned)

			def data = [
				user: userInstance.id,
				userRemoved: userInstance.id
			]
			Object[] messageArgs = [userInstance.toString()]
			gameChatService.addMessageUpdate(game, "staging.user.removed", messageArgs)
			
			gameStagingService.addStagingUpdate(game, data)
		}
		
		redirect mapping:"dropship"
	}
	
	/**
	 * Gets names and information about the available maps
	 * @respond object containing the names and info about each map
	 */
	@Transactional(readOnly = true)
	def mapSelect() {
		def userInstance = currentUser()
		if(userInstance) {
			params.max = Math.min(params.max ? params.int('max') : 20, 100)
			params.sort = params.sort ?: "name"
			params.order = params.order ?: "asc"
			
			def model = [hexMapInstanceList: HexMap.list(params), hexMapInstanceTotal: HexMap.count()]
			
			//if(request.xhr)
			// ajax request code from http://www.craigburke.com/2011/01/01/grails-ajax-list-with-paging-and-sorting.html
			render(template: "mapSelect", model: model)
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
		
		def data = [
			user: userInstance.id,
			map: b.toString()
		]
		
		Object[] messageArgs = [b.name()]
		gameChatService.addMessageUpdate(game, "staging.map.changed", messageArgs)
		
		gameStagingService.addStagingUpdate(game, data)
		
		// TODO: make the map load asynchronously, then if launched too soon just make the players wait until it is loaded?
		b.loadMap()
		
		render ([updated:true] as JSON)
	}
	
	/**
	 * Gets names and information about the available units
	 * @respond object containing the names and info about each unit
	 */
	@Transactional(readOnly = true)
	def unitSelect() {
		def userInstance = currentUser()
		if(userInstance) {
			params.max = Math.min(params.max ? params.int('max') : 12, 100)
			params.sort = params.sort ?: "name"
			params.order = params.order ?: "asc"
			
			def unitCriteria = Unit.createCriteria()
			def units = unitCriteria.list (max: params.max, offset: params.offset) {
				if(params.name){
					or {
						ilike("name", "%${params.name}%")
						ilike("chassis", "%${params.name}%")
						ilike("variant", "%${params.name}%")
					}
				}
				order(params.sort, params.order)
			}
			
			def filters = [name: params.name]
			
			def model = [unitInstanceList: units, unitInstanceTotal: units.totalCount, filters: filters]
			
			//if(request.xhr)
			// ajax request code from http://www.craigburke.com/2011/01/01/grails-ajax-list-with-paging-and-sorting.html
			render(template: "unitSelect", model: model)
		}
		else {
			redirect url: "/"
		}
	}
	
	/**
	 * Allows for individual calls to render a user's unit on the stage
	 * @return
	 */
	@Transactional(readOnly = true)
	def stageUnit() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		Game gameInstance = Game.read(session.game)
		if(gameInstance == null) return
		
		if(params.userId == null) return
		MekUser thisUser = MekUser.read(params.userId)
		if(thisUser == null) return
		
		if(params.unitId == null) return
		BattleUnit thisUnit = BattleUnit.read(params.unitId)
		// TODO: figure out why only when server code is changed during run-app, this starts failing to find the unit after added in staging...
		if(thisUnit == null) return
		
		render (template: 'stageUnit', model: [unit: thisUnit, showUnitDelete: (userInstance?.id == thisUser?.id)])
	}
	
	/**
	 * Allows for individual calls to render a unit preview
	 */
	@Transactional(readOnly = true)
	def previewUnit() {
		Unit thisUnit = Unit.read(params.unitId)
		
		render (template: 'previewUnit', model: [unit: thisUnit])
	}
	
	/**
	 * Adds the selected unit to the game
	 * @return
	 */
	def addUnit() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// units can only be updated in the Init stage
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		// make sure max units per player and max units per game settings will not be breached
		def maxUserUnits = grailsApplication.config.roguemek.game.settings.maxUserUnits ?: 12
		def maxBattleUnits = grailsApplication.config.roguemek.game.settings.maxBattleUnits ?: 24
		
		def unitsByUser = game.getStagingUnitsByUser()
		def userUnitCount = unitsByUser[userInstance].size()
		if(userUnitCount >= maxUserUnits) {
			Object[] messageArgs = [userInstance.toString(), maxUserUnits]
			gameChatService.addMessageUpdate(game, "staging.unit.user.limit", messageArgs)
			render ([updated:false] as JSON)
			return
		}
		
		def battleUnitCount = 0
		unitsByUser.each { MekUser thisUser, def unitList ->
			battleUnitCount += unitList.size()
		}
		if(battleUnitCount >= maxBattleUnits) {
			Object[] messageArgs = [maxBattleUnits]
			gameChatService.addMessageUpdate(game, "staging.unit.game.limit", messageArgs)
			render ([updated:false] as JSON)
			return
		}
		
		if(params.unitId == null) return
		Unit unitInstance = Unit.read(params.unitId)
		if(unitInstance == null) return
		
		// create the BattleUnit instance to load into the game
		BattleUnit battleUnitInstance
		if(unitInstance instanceof Mech) {
			// TODO: create pilots with random names, but eventually show pilot selection to player
			def testPilot = new Pilot(temporary: true, firstName: Name.getRandom().name, lastName: Surname.getRandom().surname, ownerUser: userInstance, status: Pilot.STATUS_ACTIVE)
			testPilot.save flush: true
			
			// set the unit color to the color selected by the player
			def camoSelection = StagingHelper.getCamoForUser(game, userInstance)
			
			def rgbCamo = [255, 0, 0]
			if(camoSelection instanceof Short[]) {
				rgbCamo = camoSelection
			}
			
			battleUnitInstance = new BattleMech(pilot: testPilot, mech: unitInstance, x: 0, y: 0, heading: 3, rgb: rgbCamo)
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
		
			log.debug('Initialized battle unit '+battleUnitInstance.mech?.name+" with ID="+battleUnitInstance.id)
		}
		
		def result = StagingHelper.addUnitForUser(game, userInstance, battleUnitInstance)
		if(!result) {
			return
		}
		
		def data = [
			user: userInstance.id,
			unitAdded: battleUnitInstance.id
		]
		Object[] messageArgs = [userInstance.toString(), battleUnitInstance.toString()]
		gameChatService.addMessageUpdate(game, "staging.unit.added", messageArgs)
		
		gameStagingService.addStagingUpdate(game, data)
		
		render ([updated:true] as JSON)
	}
	
	/**
	 * Removes the selected unit from the game
	 * @return
	 */
	def removeUnit() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// units can only be updated in the Init stage
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.unitId == null) return
		BattleUnit unitInstance = BattleUnit.get(params.unitId)
		if(unitInstance == null) return
		
		// make sure only the unit owner can remove the unit
		if(!unitInstance.isUsedBy(userInstance)) return
		
		def result = StagingHelper.removeUnitForUser(game, userInstance, unitInstance)
		if(!result) {
			return
		}
		
		// TODO: remove the BattleUnit from the database, if it is not owned (also remove the pilot if not owned)
		
		def data = [
			user: userInstance.id,
			unitRemoved: unitInstance.id
		]
		Object[] messageArgs = [userInstance.toString(), unitInstance.toString()]
		gameChatService.addMessageUpdate(game, "staging.unit.removed", messageArgs)
		
		gameStagingService.addStagingUpdate(game, data)
		
		render ([updated:true] as JSON)
	}
	
	/**
	 * Allows for individual calls to render a user on the stage
	 * @return
	 */
	@Transactional(readOnly = true)
	def stageUser() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		Game gameInstance = Game.read(session.game)
		if(gameInstance == null) return
		
		if(params.userId == null) return
		MekUser thisUser = MekUser.read(params.userId)
		if(thisUser == null) return
		
		render ( template: 'stageUser', model: [gameInstance: gameInstance, userInstance: userInstance, user: thisUser])
	}
	
	/**
	 * Adds the current User to the game
	 * @return
	 */
	def addUser() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// users can only be updated in the Init stage
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return

		// generate staging information for the new user
		gameStagingService.generateStagingForUser(game, userInstance)
		
		def data = [
			user: userInstance.id,
			userAdded: userInstance.id
		]
		Object[] messageArgs = [userInstance.toString()]
		gameChatService.addMessageUpdate(game, "staging.user.added", messageArgs)
		
		gameStagingService.addStagingUpdate(game, data)
		
		render ([updated:true] as JSON)
	}
	
	/**
	 * Removes the selected user from the game
	 * @return
	 */
	def removeUser() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// users can only be updated in the Init stage
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToRemove = MekUser.read(params.userId)
		if(userToRemove == null) return
		
		// make sure only the user or the game owner can remove the user
		if(userInstance != game.ownerUser && userInstance != userToRemove) return

		StagingUser thisStagingData = StagingHelper.getStagingForUser(game, userToRemove)
		thisStagingData.delete flush:true
		
		// TODO: remove any of the user's BattleUnit from the database, if it is not owned (also remove the pilot if not owned)

		def data = [
			user: userInstance.id,
			userRemoved: userToRemove.id
		]
		Object[] messageArgs = [userToRemove.toString()]
		gameChatService.addMessageUpdate(game, "staging.user.removed", messageArgs)
		
		gameStagingService.addStagingUpdate(game, data)
		
		render ([updated:true] as JSON)
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
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToUpdate = MekUser.read(params.userId)
		if(userToUpdate == null) return
		
		// make sure only the user or the game owner can update the user
		if(userInstance != game.ownerUser && userInstance != userToUpdate) return
		
		def locationUpdated = StagingHelper.setStartingLocationForUser(game, userToUpdate, startingLocation)
		
		if(locationUpdated) {
			def data = [
				user: userToUpdate.id,
				location: startingLocation
			]
			Object[] messageArgs = [userToUpdate.toString(), startingLocation]
			gameChatService.addMessageUpdate(game, "staging.location.changed", messageArgs)
			
			gameStagingService.addStagingUpdate(game, data)
		}
		
		render ([updated:locationUpdated] as JSON)
	}
	
	/**
	 * Gets the camo selection page ready
	 * @respond
	 */
	@Transactional(readOnly = true)
	def camoSelect() {
		def userInstance = currentUser()
		
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToUpdate = MekUser.read(params.userId)
		
		if(userToUpdate) {
			// pass along a unit for preview if one exists
			BattleUnit previewUnit = StagingUser.findByGameAndUser(game, userToUpdate)?.units[0]

			render template: 'camoSelect', model:[gameInstance:game, userInstance:userToUpdate, previewUnit:previewUnit]
		}
		else {
			redirect url: "/"
		}
	}
	
	/**
	 * Updates the preview camo selection of the user
	 * @return
	 */
	def camoUpdate() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		Short[] rgbCamo
		
		try{
			def rgbR = params["rgbCamo[r]"].toShort()
			def rgbG = params["rgbCamo[g]"].toShort()
			def rgbB = params["rgbCamo[b]"].toShort()
			
			rgbCamo = [rgbR, rgbG, rgbB]
		}catch(Exception e){}
		
		if(rgbCamo == null) return
		
		// users can only be updated in the Init stage
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToUpdate = MekUser.read(params.userId)
		if(userToUpdate == null) return
		
		// make sure only the user or the game owner can update the user
		if(userInstance != game.ownerUser && userInstance != userToUpdate) return
		
		def camoUpdated = StagingHelper.setCamoForUser(game, userToUpdate, rgbCamo)
		
		// apply the new camo to the first unit for the user so it can be displayed as a preview
		BattleUnit u = StagingUser.findByGameAndUser(game, userToUpdate)?.units[0]
		if(u != null) {
			u.rgb = rgbCamo
			u.image = BattleUnit.initUnitImage(u)
			
			u.save flush:true
		}
		
		def result = [
			updated:camoUpdated,
			image: u?.image
		]
		
		render result as JSON
	}
	
	/**
	 * Applies the camo selection to all units for the user
	 * @return
	 */
	def camoApply() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		// units can only be updated in the Init stage
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToUpdate = MekUser.read(params.userId)
		if(userToUpdate == null) return
		
		// make sure only the user or the game owner can update the user
		if(userInstance != game.ownerUser && userInstance != userToUpdate) return
		
		def camoApplied = true
		def camoToApply = StagingHelper.getCamoForUser(game, userToUpdate)
		
		if(camoToApply != null) {
			// apply the new camo to the each unit for the user so it can be displayed as a preview
			for(BattleUnit u in StagingHelper.getUnitsForUser(game, userToUpdate)) {
				if(camoToApply instanceof Short[]){
					// groovy list "equals" only works if cast as int[] array
					if(u.rgb != null
							&& (camoToApply as int[]).equals(u.rgb as int[])){
						// nothing to change
						continue
					}
					
					u.rgb = camoToApply
				}
				
				u.image = BattleUnit.initUnitImage(u)
				
				u.save flush:true
			}
		}
		else {
			camoApplied = false
		}
		
		if(camoApplied
				&& camoToApply instanceof Short[]) {
			def data = [
				user: userToUpdate.id,
				rgbCamo: [camoToApply[0], camoToApply[1], camoToApply[2]]
			]
			Object[] messageArgs = [userToUpdate.toString()]
			gameChatService.addMessageUpdate(game, "staging.camo.color.changed", messageArgs)
			
			gameStagingService.addStagingUpdate(game, data)
		}
		
		def result = [
			updated:camoApplied,
		]
		
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
