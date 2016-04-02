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
				GameChatUser chatUser = GameChatUser.findByGameAndChatUser(game, user)
				if(chatUser != null) {
					chatUser.delete flush:true
				}
				
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
}
