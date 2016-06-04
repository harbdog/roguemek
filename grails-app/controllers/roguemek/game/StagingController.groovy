package roguemek.game

import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*
import roguemek.*
import roguemek.chat.*
import roguemek.model.*
import roguemek.assets.ContextHelper

@Transactional
class StagingController {

	transient springSecurityService
	def grailsApplication
	
	def gameChatService
	def gameStagingService
	def mechService
	def unitService
	
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
		
		// For some reason, if the announcement of the new staged user comes too soon
		// after being created, it can occasionally, randomly, fail to be found
		// despite being flushed inside generateStagingForUser...
		// So we will delay it until just before responding to give it time
		def delayedStagingAnnouncement = false
		
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
			
			delayedStagingAnnouncement = true
		}
		
		// get all users staged in the game
		def stagingUsers = game.isInit() ? game.getStagingUsersByTeam() : null
		
		def sortedUsers
		if(game.isInit()) {
			sortedUsers = StagingUser.executeQuery(
					'select u.user from StagingUser u where u.game=:game',
					[game: game]
			).sort( false, { u1, u2 -> u1.callsign <=> u2.callsign } )
		}
		else { 
			sortedUsers = game.users.sort( false, { u1, u2 -> u1.callsign <=> u2.callsign } )
		}
		
		def chatMessages = ChatMessage.findAllByOptGameId(game.id, [sort: "time", order: "asc"])
		
		if(delayedStagingAnnouncement) {
			def data = [
				user: userInstance.id,
				userAdded: userInstance.id,
				userName: userInstance.toString()
			]
			Object[] messageArgs = [userInstance.toString()]
			gameChatService.addMessageUpdate(game, "staging.user.added", messageArgs)
			
			gameStagingService.addStagingUpdate(game, data)
		}
		
		session["game"] = game.id
		
		respond game, model:[userInstance:userInstance, sortedUsers: sortedUsers,
				stagingUsers:stagingUsers, stagingInstance:stagingInstance, 
				chatMessages:chatMessages]
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
			
			GameTeam.executeUpdate(
					"delete GameTeam gt where gt.game=:game and gt.user=:user",
					[game: game, user: userInstance])
                    
            GameChatUser.executeUpdate(
    				"delete GameChatUser gc where gc.game=:game and gc.chatUser=:user",
    				[game: game, user: userInstance])
			
			// TODO: remove any of the user's BattleUnit from the database, if it is not owned (also remove the pilot if not owned)

			def data = [
				user: userInstance.id,
				userRemoved: userInstance.id,
				userName: userInstance.toString()
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
			params.max = Math.min(params.max ? params.int('max') : 15, 100)
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
		
		// unready all staged users just before saving
		def gameUsers = gameStagingService.setAllUsersReady(game, false)
		gameUsers.each { MekUser rUser ->
			def rData = [
				user: rUser.id,
				userReady: false
			]
			
			gameStagingService.addStagingUpdate(game, rData)
		}
		
		// now we're ready to save
		b.save flush:true
		
		def data = [
			user: userInstance.id,
			map: b.toString(),
			mapId: b.mapId()
		]
		
		Object[] messageArgs = [b.name()]
		gameChatService.addMessageUpdate(game, "staging.map.changed", messageArgs)
		
		gameStagingService.addStagingUpdate(game, data)
		
		// TODO: make the map load asynchronously, then if launched too soon just make the players wait until it is loaded?
		b.loadMap()
		
		render ([updated:true] as JSON)
	}
	
	/**
	 * Allows for individual calls to render a map preview
	 */
	 @Transactional(readOnly = true)
	def previewMap() {
		HexMap map = HexMap.read(params.mapId)
		if(map == null) return
		
		render (template: 'previewMap', model: [map: map])
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
			
			// check to see if the name param is only numbers, if so it can be used as a mass filter
			def nameParam = params.name
			float floatParam = 0
			
			// check to see if the name param is "CHA-VAR" format for chassis-variant search
			def chassisParam
			def variantParam
			
			if(nameParam ==~ /\d+/) {		// RegEx for entire string to match pattern of digits only
				floatParam = Float.valueOf(nameParam)
			}
			else if(nameParam =~ /-/) {
				// query contains a dash, use as basis for chassis-variant
				int dashIndex = nameParam.indexOf('-')
				chassisParam = nameParam.substring(0, dashIndex)
				variantParam = nameParam.substring(dashIndex + 1)
			}
			
			// compile list of units grouped by name, sorted and paginated
			def unitCriteria = Unit.createCriteria()
			def units = unitCriteria.list(max: params.max, offset: params.offset) {
				if(nameParam){
					if(floatParam > 0) {
						// allow user to enter a number value to find by exact tonnage (mass)
						eq("mass", floatParam)
					}
					else if(chassisParam && variantParam) {
						and {
							eq("chassis", chassisParam, [ignoreCase: true])
							eq("variant", variantParam, [ignoreCase: true])
						}
					}
					else {
						or {
							ilike("name", "%${nameParam}%")
							ilike("chassis", "%${nameParam}%")
							ilike("variant", "%${nameParam}%")
						}
					}
				}
				and {
					// make sure the secondary sort is always the name
					order(params.sort, params.order)
					if(params.sort != "name") {
						// make sure the secondary sort is always the name
						order("name", "asc")
					}
				}
				projections {
					// the main selection table will only display the chassis name and mass
					groupProperty("name")
					groupProperty("mass")
				}
			}
			
			// Use the names from the first result set to create the list that will be displayed
			def unitNames = []
			units.each { row ->
				unitNames << row[0]
			}
			
			// within the given list of names, get and sort further by variant
			def listCriteria = Unit.createCriteria()
			def unitList = listCriteria.list {
				'in'("name", unitNames)
				if(nameParam){
					if(floatParam > 0) {
						// allow user to enter a number value to find by exact tonnage (mass)
						eq("mass", floatParam)
					}
					else if(chassisParam && variantParam) {
						and {
							eq("chassis", chassisParam, [ignoreCase: true])
							eq("variant", variantParam, [ignoreCase: true])
						}
					}
					else {
						or {
							ilike("name", "%${nameParam}%")
							ilike("chassis", "%${nameParam}%")
							ilike("variant", "%${nameParam}%")
						}
					}
				}
				and {
					order(params.sort, params.order)
					if(params.sort != "name") {
						// make sure the secondary sort is always the name
						order("name", "asc")
					}
					if(params.sort != "variant") {
						// make sure the tertiary sort is always the variant
						order("variant", "asc")
					}
				}
			}
			
			// the totalCount using groupProperty projection was incorrect, going to need a separate query
			def distinctCount = Unit.createCriteria().get {
				projections {
					countDistinct "name"
				}
			}
			
			def filters = [name: params.name]
			
			def model = [unitList: unitList, unitTotal: distinctCount, chassisTotal: unitNames.size(), filters: filters]
			
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
	def previewUnit() {
		// Note: this method needs to be transactional since the summary data can be cached in the database
		Unit thisUnit = Unit.read(params.unitId)
		if(thisUnit == null) return
		
		String externalUnitLink = grailsApplication.config.roguemek.external.settings.externalUnitLink
		if(thisUnit != null && externalUnitLink != null && externalUnitLink.length() > 0) {
			externalUnitLink = "${externalUnitLink}${thisUnit.name}"
		}
		else {
			externalUnitLink = null
		}
		
		def unitSummary = unitService.getUnitSummaryData(thisUnit)
		
		render (template: 'previewUnit', model: [unit: thisUnit, unitSummary: unitSummary, unitLink: externalUnitLink])
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
			
			battleUnitInstance = new BattleMech(pilot: testPilot, mech: unitInstance, x: 0, y: 0, heading: 3)
			
			// set the unit color to the color selected by the player
			def camoSelection = StagingHelper.getCamoForUser(game, userInstance)
			if(camoSelection instanceof Short[]) {
				battleUnitInstance.rgb = camoSelection
			}
			else if(camoSelection instanceof String) {
				battleUnitInstance.camoFile = camoSelection
			}
		}
		
		if(battleUnitInstance == null) return
		
		// unready the user before adding just in case
		if(gameStagingService.setUserReady(game, userInstance, false)) {
			// send update that the user is no longer ready
			def rData = [
				user: userInstance.id,
				userReady: false
			]
			gameStagingService.addStagingUpdate(game, rData)
		}
		
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
		
		def result = gameStagingService.addUnitForUser(game, userInstance, battleUnitInstance)
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
		
		// unready the user before removing just in case
		if(gameStagingService.setUserReady(game, userInstance, false)) {
			// send update that the user is no longer ready
			def rData = [
				user: userInstance.id,
				userReady: false
			]
			gameStagingService.addStagingUpdate(game, rData)
		}
		
		def result = gameStagingService.removeUnitForUser(game, userInstance, unitInstance)
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
	 * Sets the staged user to ready or not ready status
	 * @return
	 */
	def readyUser() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		Game gameInstance = Game.read(session.game)
		if(gameInstance == null) return
		
		boolean userReady = params.boolean('ready') ?: false
		
		StagingUser thisStagingData = StagingHelper.getStagingForUser(gameInstance, userInstance)
		thisStagingData.isReady = userReady
		def result = thisStagingData.save flush:true
		
		if(!result) {
			log.debug result.errors
			return
		}
		
		def data = [
			user: userInstance.id,
			userReady: userReady
		]
		
		gameStagingService.addStagingUpdate(gameInstance, data)
		
		render ([updated:true] as JSON)
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
			userAdded: userInstance.id,
			userName: userInstance.toString()
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

		GameTeam.executeUpdate(
				"delete GameTeam gt where gt.game=:game and gt.user=:user",
				[game: game, user: userToRemove])
				
		GameChatUser.executeUpdate(
				"delete GameChatUser gc where gc.game=:game and gc.chatUser=:user",
				[game: game, user: userToRemove])

		StagingUser thisStagingData = StagingHelper.getStagingForUser(game, userToRemove)
		thisStagingData.delete flush:true
		
		// TODO: remove any of the user's BattleUnit from the database, if it is not owned (also remove the pilot if not owned)

		def data = [
			user: userInstance.id,
			userRemoved: userToRemove.id,
			userName: userInstance.toString()
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
		
		// unready the user before updating just in case
		if(gameStagingService.setUserReady(game, userToUpdate, false)) {
			// send update that the user is no longer ready
			def rData = [
				user: userToUpdate.id,
				userReady: false
			]
			gameStagingService.addStagingUpdate(game, rData)
		}
		
		def locationUpdated = gameStagingService.setStartingLocationForUser(game, userToUpdate, startingLocation)
		
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
			
			// generate top level camo pattern folders
			def camoPatternPaths = []
			def pathRegex = ~/.*[\\|\/](.*)/
			Set<String> camoPaths = ContextHelper.getResourcePaths("/assets/images/camo/", false)
			camoPaths.each { path ->
				path.find(pathRegex) { fullMatch, regPath ->
					camoPatternPaths << regPath
				}
			}
			
			//camoPatternPaths.sort( true, { a, b -> a <=> b } )

			render template: 'camoSelect', model:[gameInstance:game, userInstance:userToUpdate, previewUnit:previewUnit, camoPatternPaths: camoPatternPaths]
		}
		else {
			redirect url: "/"
		}
	}
	
	/**
	 * Handles selection of a camo pattern path to either select the camo or expand the path to list contents
	 */
	def camoPath() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToUpdate = MekUser.read(params.userId)
		if(userToUpdate == null) return
		
		//if(params.path == null) return
		def patternPath = params.path ?: ""
		
		def result = [
			updated: false
		]
		
		if(patternPath.toLowerCase().endsWith(".jpg")) {
			// pattern was chosen
			def camoUpdated = gameStagingService.setCamoForUser(game, userToUpdate, patternPath)
			
			// apply the new camo to the first unit for the user so it can be displayed as a preview
			BattleUnit u = StagingUser.findByGameAndUser(game, userToUpdate)?.units[0]
			if(u != null) {
				u.camoFile = patternPath
				u.image = BattleUnit.initUnitImage(u)
				
				u.save flush:true
			}
			
			result.updated = camoUpdated
			result.image = u?.image
		}
		else {
			// path was chosen, generate child level camo pattern folders and image files
			def camoPatternPaths = []
			def pathRegex = ~/.*[\\|\/](.*)/
			Set<String> camoPaths = ContextHelper.getResourcePaths("/assets/images/camo/${patternPath}", false)
			camoPaths.each { path ->
				path.find(pathRegex) { fullMatch, regPath ->
					camoPatternPaths << regPath
				}
			}
			
			//camoPatternPaths.sort( true, { a, b -> a <=> b } )
			
			result.camoPatternPaths = camoPatternPaths
		}
		
		render result as JSON
	}
	
	/**
	 * Updates the RGB preview camo selection of the user
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
		
		// unready the user before updating just in case
		if(gameStagingService.setUserReady(game, userInstance, false)) {
			// send update that the user is no longer ready
			def rData = [
				user: userInstance.id,
				userReady: false
			]
			gameStagingService.addStagingUpdate(game, rData)
		}
		
		def camoUpdated = gameStagingService.setCamoForUser(game, userToUpdate, rgbCamo)
		
		// apply the new camo to the first unit for the user so it can be displayed as a preview
		BattleUnit u = StagingUser.findByGameAndUser(game, userToUpdate)?.units[0]
		if(u != null) {
			u.rgb = rgbCamo
			u.camoFile = null
			u.image = BattleUnit.initUnitImage(u)
			
			u.save flush:true
		}
		
		def result = [
			updated: camoUpdated,
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
					if(u.rgb != null && u.camoFile == null
							&& (camoToApply as int[]).equals(u.rgb as int[])){
						// nothing to change
						continue
					}
					
					u.rgb = camoToApply
					u.camoFile = null
				}
				else if(camoToApply instanceof String) {
					// camo path string is being used
					if(u.camoFile == camoToApply) {
						// nothing to change
						continue
					}
					
					u.camoFile = camoToApply
				}
				
				u.image = BattleUnit.initUnitImage(u)
				
				u.save flush:true
			}
		}
		else {
			camoApplied = false
		}
		
		if(camoApplied){
			def data
			if(camoToApply instanceof Short[]) {
				data = [
					user: userToUpdate.id,
					rgbCamo: [camoToApply[0], camoToApply[1], camoToApply[2]]
				]
				Object[] messageArgs = [userToUpdate.toString()]
				gameChatService.addMessageUpdate(game, "staging.camo.color.changed", messageArgs)
				
				gameStagingService.addStagingUpdate(game, data)
			}
			else if(camoToApply instanceof String) {
				data = [
					user: userToUpdate.id,
					patternCamo: camoToApply
				]
				Object[] messageArgs = [userToUpdate.toString()]
				gameChatService.addMessageUpdate(game, "staging.camo.pattern.changed", messageArgs)
			}
			
			if(data) {
				gameStagingService.addStagingUpdate(game, data)
			}
		}
		
		def result = [
			updated:camoApplied,
		]
		
		render result as JSON
	}
	
	/**
	 * Updates the team of the given user
	 * @return
	 */
	def teamUpdate() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		def teamNum = params.int('teamNum', -1)
		
		// users can only be updated in the Init stage
		Game game = Game.read(session.game)
		if(game == null || !game.isInit()) return
		
		if(params.userId == null) return
		MekUser userToUpdate = MekUser.read(params.userId)
		if(userToUpdate == null) return
		
		// make sure only the user or the game owner can update the user
		if(userInstance != game.ownerUser && userInstance != userToUpdate) return
		
		// unready the user before updating just in case
		if(gameStagingService.setUserReady(game, userToUpdate, false)) {
			// send update that the user is no longer ready
			def rData = [
				user: userToUpdate.id,
				userReady: false
			]
			gameStagingService.addStagingUpdate(game, rData)
		}
		
		def teamUpdated = gameStagingService.setTeamForUser(game, userToUpdate, teamNum)
		
		if(teamUpdated) {
			def data = [
				user: userToUpdate.id,
				teamNum: teamNum
			]
			Object[] messageArgs = [userToUpdate.toString(), teamNum]
			gameChatService.addMessageUpdate(game, (teamNum >= 0) ? "staging.team.changed" : "staging.team.changed.noteam", messageArgs)
			
			gameStagingService.addStagingUpdate(game, data)
		}
		
		render ([updated:teamUpdated] as JSON)
	}
	
	/**
	 * Allows for individual calls to render a team on the stage
	 * @return
	 */
	@Transactional(readOnly = true)
	def stageTeam() {
		def userInstance = currentUser()
		if(userInstance == null) return
		
		Game gameInstance = Game.read(session.game)
		if(gameInstance == null) return
		
		if(params.userId == null) return
		MekUser thisUser = MekUser.read(params.userId)
		if(thisUser == null) return
		
		def teamNum = -1
		def teamStagingUsers = []
		
		GameTeam gTeam = GameTeam.findByGameAndUser(gameInstance, thisUser)
		if(gTeam) {
			// TODO: make a single query to do this
			teamNum = gTeam.team
			def gTeamUsers = GameTeam.findByGameAndTeam(gameInstance, teamNum)
			gTeamUsers.each { gUserTeam ->
				teamStagingUsers << StagingUser.findByGameAndUser(gameInstance, gUserTeam.user)
			}
		}
		else {
			teamStagingUsers << StagingUser.findByGameAndUser(gameInstance, thisUser)
		}
		
		render ( template: 'stageTeam', model: [gameInstance: gameInstance, userInstance: userInstance, teamNum: teamNum, teamStagingUsers: teamStagingUsers])
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
