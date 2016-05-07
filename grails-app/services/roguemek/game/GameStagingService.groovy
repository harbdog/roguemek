package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import org.springframework.context.i18n.LocaleContextHolder
import org.atmosphere.cpr.Broadcaster
import org.atmosphere.cpr.BroadcasterFactory

import grails.converters.JSON
import grails.transaction.Transactional
import roguemek.*
import roguemek.model.*
import static org.atmosphere.cpr.MetaBroadcaster.metaBroadcaster
import grails.async.Promise
import static grails.async.Promises.*

@Transactional
class GameStagingService extends AbstractGameService {
	private static Log log = LogFactory.getLog(this)
	
	def messageSource
	def gameChatService
	
	def recordUnusedData(data) {
		log.info "GameStagingService.recordUnusedData: ${data}"
	}
	
	def recordIncompleteData(data) {
		// This method could be used to persist errors to a data store.
		log.error "GameStagingService.recordIncompleteMessage: ${data}"
	}

	def recordMaliciousUseData(data) {
		// This method could be used to persist potential malicious code to a data store.
		log.warn "GameStagingService.recordMaliciousUseWarning: ${data}"
	}
	
	/**
	 * Handles connecting the user to the staging chat
	 */
	def sendConnect(request) {
		def user = currentUser(request)
		if(user == null) return
		
		def session = request.getSession(false)
		if(session.game != null){
			Game game = Game.load(session.game)
			
			// add the user to the chat users list
			if(game) {
				GameChatUser chatUser = GameChatUser.findByGameAndChatUser(game, user)
				if(chatUser == null) {
					chatUser = new GameChatUser(game: game, chatUser: user)
					chatUser.save flush:true
					
					// broadcast new user
					def data = [
						chatUser: [
							add: true,
							userid: user.id,
							username:user.toString()
						]
					]
					addStagingUpdate(game, data)
				}
			}
		}
	}
	
	/**
	 * Handles disconnecting the user from the staging chat
	 */
	def sendDisconnect(request) {
		def user = currentUser(request)
		if(user == null) return
		
		def session = request.getSession(false)
		if(session.game != null){
			Game game = Game.load(session.game)
			
			// remove the user from the chat users list
			if(game) {
				// TODO: in case the same chat user is connected to same game in two windows, figure it out
				GameChatUser.executeUpdate(
						"delete GameChatUser gcu where gcu.game=:game and gcu.chatUser=:user",
						[game: game, user: user])
				
				// broadcast removed user
				def data = [
					chatUser: [
						remove: true,
						userid: user.id,
						username:user.toString()
					]
				]
				addStagingUpdate(game, data)
			}
		}
	}
	
	/**
	 * Broadcasts an update to staging clients
	 */
	def addStagingUpdate(Game game, Map data) {
		if(game == null || data == null) return
		
		String mapping = StagingMeteorHandler.MAPPING_GAME +"/"+ game.id
		
		log.debug "GameStagingService.addStagingUpdate: ${mapping} = ${data}"
		
		def finishedResponse = data as JSON
		metaBroadcaster.broadcastTo(mapping, finishedResponse)
	}
	
	/**
	 * Applies staging settings to game elements
	 * @param game
	 */
	void stageGame(Game game) {
		if(game == null) return
		
		// clear locations for each unit
		for(BattleUnit unit in game.units) {
			if(unit.x != null || unit.y != null) {
				unit.x = null
				unit.y = null
				
				unit.save flush:true
			}
		}
		
		// determine starting locations for each unit (in reverse order so the units nearer the edge will be last to move)
		for(BattleUnit unit in game.units.reverse()) {
			MekUser playerUser = unit.getPlayerUser()
			
			def startingLocation = StagingHelper.getStartingLocationForUser(game, playerUser)
			
			generateUnitStartingPosition(game, unit, startingLocation)
		}
		
		// clear any staging data that was used during initialization
		game.clearStagingData()
	}
	
	/**
	 * Generates and saves the starting position for the given unit based on the set starting location
	 * @param game
	 * @param unit
	 * @param startingLocation
	 * @return
	 */
	void generateUnitStartingPosition(Game game, BattleUnit unit, String startingLocation) {
		Coords genLocation = null;
		int genHeading = 0;
		
		int numHexCols = game.board.numCols()
		int numHexRows = game.board.numRows()
		
		if(Game.STARTING_RANDOM.equals(startingLocation)){
			// this unit has completely random starting locations and headings anywhere on the board
			genLocation = new Coords(0,0);
			genHeading = Roll.getDieRollTotal(1, 6) - 1;
			
			def hexAvailable = false;
			while(!hexAvailable){
				int randomX = Roll.getDieRollTotal(1, numHexCols) - 1;
				int randomY = Roll.getDieRollTotal(1, numHexRows) - 1;
				
				genLocation = new Coords(randomX, randomY);
				
				hexAvailable = !game.isHexOccupied(genLocation);
			}
		}
		else {
			int xMin = 1;
			int yMin = 1;
			
			// the headings are based on the closest opposite direction of the area they are starting in
			switch(startingLocation){
				case Game.STARTING_N:
					// at N, face S
					genHeading =  3
					
					xMin = Math.floor(numHexCols / 2)
					yMin = 0
					break
					
				case Game.STARTING_S:
					// at S, face N
					genHeading = 0
					
					xMin = Math.floor(numHexCols / 2)
					yMin = numHexRows - 5
					break
				
				case Game.STARTING_W:
					// at W, face SE
					genHeading = 2
					
					xMin = 0
					yMin = Math.floor(numHexRows / 2)
					break
					
				case Game.STARTING_E:
					// at E, face NW
					genHeading = 5
					
					xMin = numHexCols - 5
					yMin = Math.floor(numHexRows / 2)
					break
					
				case Game.STARTING_NW:
					// at NW, face SE
					genHeading = 2
					
					xMin = 0
					yMin = 0
					break
					
				case Game.STARTING_SE:
					// at SE, face NW
					genHeading = 5
					
					xMin = numHexCols - 1
					yMin = numHexRows - 1
					break
					
				case Game.STARTING_NE:
					// at NE, face SW
					genHeading = 4
					
					xMin = numHexCols - 1
					yMin = 0
					break
					
				case Game.STARTING_SW:
					// at SW, face NE
					genHeading = 1
					
					xMin = 0
					yMin = numHexRows - 1
					break
					
				case Game.STARTING_CENTER:
					// at Center, face random
					genHeading = Roll.getDieRollTotal(1, 6) - 1
					
					xMin = Math.floor(numHexCols / 2) - 1
					yMin = Math.floor(numHexRows / 2) - 1
					break
					
				default: break
			}
			
			// try starting at the given corner/edge
			genLocation = new Coords(xMin, yMin)
			
			// check the exact location of the corner/edge first
			def hexAvailable = !game.isHexOccupied(genLocation)
			
			def hexDistance = 1
			def numCols = game.getBoard().getMap().getNumCols()
			def numRows = game.getBoard().getMap().getNumRows()
			while(!hexAvailable){
				// start moving away from the origination point until an open hex is found
				def tryCoords = []
				
				for(int thisX=-hexDistance; thisX<=hexDistance; thisX++) {
					for(int thisY=-hexDistance; thisY<=hexDistance; thisY++) {
						Coords thisCoord = new Coords(thisX + xMin, thisY + yMin)
						
						if(thisCoord.x >= 0 && thisCoord.y >= 0
								&& thisCoord.x < numCols && thisCoord.y < numRows){
							tryCoords.add(thisCoord)
						}
					}
				}
				
				// start going through the coords at random
				Collections.shuffle(tryCoords)
				
				for(Coords thisCoord in tryCoords) {
					hexAvailable = !game.isHexOccupied(thisCoord)
					if(hexAvailable) {
						genLocation = thisCoord
						break
					}
				}
				
				hexDistance ++
			}
		}
		
		unit.heading = genHeading
		unit.x = genLocation.x
		unit.y = genLocation.y
		
		unit.save flush:true
	}
	
	/**
	 * Generates the staging information for the given user
	 */
	StagingUser generateStagingForUser(Game game, MekUser userInstance) {
		if(game == null || userInstance == null) return null
		
		StagingUser stageUser = StagingUser.findByGameAndUser(game, userInstance)
		
		if(stageUser == null) {
			stageUser = new StagingUser(game: game, user: userInstance)
			stageUser.save flush:true
		}
		
		return stageUser
	}
	
	/**
	 * Gets the list of names of users in the staging chat for a game
	 */
	@Transactional(readOnly = true)
	def getStagingChatUsers(Game game) {
		def chatUsers = []
		
		def chatUserObjects = GameChatUser.findAllByGame(game)
		for(GameChatUser gameChatObject in chatUserObjects) {
			// TODO: build a custom query to list the names since this is probably using multiple queries to do the task
			chatUsers.add(gameChatObject?.chatUser.toString())
		}
		
		return chatUsers
	}
	
	/**
	 * Cleans up a game that is being staged along with all temporary data elements
	 */
	def deleteGame(Game gameInstance) {
		if(gameInstance == null) return
		
		// get a reference to each staged unit first
		def stagedUnitsByUser = gameInstance.getStagingUnitsByUser()

		// clean up any staging references that may be hanging around
		gameInstance.clearStagingData()
		gameInstance.clearChatData()
		
		// clean up unused staging Pilots, BattleUnits and BattleEquipment
		stagedUnitsByUser.each { MekUser user, def unitList ->
			log.debug("cleaning up units for ${user}")
			
			unitList.each { BattleUnit unit ->
				if(unit.owner == null) {
					log.debug("\tcleaning unit ${unit}")
					
					if(unit instanceof BattleMech) {
						unit.cleanEquipment()
					}
					
					unit.delete flush:true
				}
				
				if(unit.pilot?.isTemporary()) {
					log.debug("\tcleaning pilot ${unit.pilot}")
					
					unit.pilot.delete flush:true 
				}
			}
		}
		
		// let those still in the staging screen be aware of the game state change
		Object[] messageArgs = []
		gameChatService.addMessageUpdate(gameInstance, "staging.game.deleted", messageArgs)
		// TODO: make it work in the client where a message shows that the game is deleted and the user gets bumped back to the dropship
		/*def data = [
			gameState: Game.GAME_DELETED
		]
		addStagingUpdate(gameInstance, data)*/
		
		gameInstance.delete flush:true
	}
	
	
	/**
	 * Adds a unit for the user to its staging data
	 * @param game
	 * @param userInstance
	 * @param unitInstance
	 * @return
	 */
	def addUnitForUser(Game game, MekUser userInstance, BattleUnit unitInstance) {
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData == null) return false
		
		thisStagingData.addToUnits(unitInstance)
		
		thisStagingData.validate()
		if(thisStagingData.hasErrors()) {
			log.error(thisStagingData.errors)
			return false
		}
		
		thisStagingData.save flush:true
		
		return true
	}
	
	/**
	 * Removes a unit for the user from its staging data
	 * @param game
	 * @param userInstance
	 * @param unitInstance
	 * @return
	 */
	def removeUnitForUser(Game game, MekUser userInstance, BattleUnit unitInstance) {
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData == null) return false
		
		thisStagingData.removeFromUnits(unitInstance)
		
		thisStagingData.validate()
		if(thisStagingData.hasErrors()) {
			log.error(thisStagingData.errors)
			return false
		}
		
		thisStagingData.save flush:true
		
		return true
	}
	
	/**
	 * Sets the camo for the user staging
	 * @param game
	 * @param userInstance
	 * @param camo
	 * @return
	 */
	boolean setCamoForUser(Game game, MekUser userInstance, def camo) {
		if(game == null || userInstance == null) return false
		
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData == null) return false
		
		thisStagingData.rgbCamo = camo
		
		thisStagingData.validate()
		if(thisStagingData.hasErrors()) {
			log.error(thisStagingData.errors)
			return false
		}
		
		thisStagingData.save flush:true
		
		// also save the color as preference on the user for later use
		userInstance.rgbColorPref = camo
		userInstance.save flush:true
		
		return true
	}
	
	/**
	 * Sets the starting location for the user based on staging data
	 * @param game
	 * @param userInstance
	 * @param location
	 * @return
	 */
	boolean setStartingLocationForUser(Game game, MekUser userInstance, String location) {
		if(game == null || userInstance == null) return false
		
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData == null) return false
		
		thisStagingData.startingLocation = location
		
		thisStagingData.validate()
		if(thisStagingData.hasErrors()) {
			log.error(thisStagingData.errors)
			return false
		}
		
		thisStagingData.save flush:true
		
		return true
	}
	
	/**
	 * Sets the team for the user
	 * @param game
	 * @param userInstance
	 * @param teamNum
	 * @return
	 */
	boolean setTeamForUser(Game game, MekUser userInstance, int teamNum) {
		if(game == null || userInstance == null) return false
		
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData == null) return false
		
		GameTeam userTeam = GameTeam.findByGameAndUser(game, userInstance)
		if(teamNum < 0) {
			// delete the team for the user
			if(userTeam) {
				userTeam.delete flush:true
			}
			else {
				// user already has no team, nothing to be done
				return false
			}
		}
		else{
			if(userTeam) {
				if(userTeam.team != teamNum) {
					userTeam.team = teamNum
				}
				else {
					// user already in that team, nothing to be done
					return false
				}
			}
			else {
				userTeam = new GameTeam(game: game, user: userInstance, team: teamNum)
			}
			
			userTeam.save flush:true
		}
		
		return true
	}
	
	/**
	 * Returns true if the staged user is denoted as ready
	 * @param game
	 * @param userInstance
	 * @return
	 */
	boolean isUserReady(Game game, MekUser userInstance) {
		return getStagingForUser(game, userInstance)?.isReady ?: false
	}
	
	/**
	 * Sets the given staged user to the given ready status
	 * @param game
	 * @param userInstance
	 * @param ready
	 * @return true if the ready status was changed
	 */
	boolean setUserReady(Game game, MekUser userInstance, boolean ready) {
		def stageUser = getStagingForUser(game, userInstance)
		if(stageUser && stageUser.isReady != ready) {
			stageUser.isReady = ready
			stageUser.save flush:true
			
			return true
		}
		
		return false
	}
	
	/**
	 * Sets all staged users to the given ready status (mostly for setting them all as not ready)
	 * @param game
	 * @param ready
	 * @return list of MekUsers that were affected
	 */
	def setAllUsersReady(Game game, boolean ready) {
		def users = []
		StagingUser.findAllByGame(game).each { StagingUser stageUser ->
			stageUser.isReady = ready
			stageUser.save flush:true
			
			users.add(stageUser.user)
		}
		
		return users
	}
	
	/**
	 * Gets the staging game information for the given user
	 */
	StagingUser getStagingForUser(Game game, MekUser userInstance) {
		if(game == null || userInstance == null) return null
		
		return StagingUser.findByGameAndUser(game, userInstance)
	}
}
