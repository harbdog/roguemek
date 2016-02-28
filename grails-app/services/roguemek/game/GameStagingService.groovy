package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import org.springframework.context.i18n.LocaleContextHolder

import org.atmosphere.cpr.Broadcaster
import org.atmosphere.cpr.BroadcasterFactory
import grails.converters.JSON

import roguemek.*
import roguemek.model.*

import static org.atmosphere.cpr.MetaBroadcaster.metaBroadcaster

class GameStagingService extends AbstractGameService {
	private static Log log = LogFactory.getLog(this)
	
	def messageSource
	
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
	
	def sendConnect(request) {
		def user = currentUser(request)
		if(user == null) return
		
		def session = request.getSession(false)
		if(session.game != null){
			Game game = Game.get(session.game)
			
			// add the user to the chat users list
			if(game?.staging?.addChatUser(user)) {
				// broadcast new user
				def data = [
					chatUsers: getStagingChatUsers(game)
				]
				addStagingUpdate(game, data)
			}
		}
	}
	
	def sendDisconnect(event, request) {
		def user = currentUser(request)
		if(user == null) return
		
		def session = request.getSession(false)
		if(session.game != null){
			Game game = Game.get(session.game)
			
			// remove the user from the chat users list
			if(game?.staging?.removeChatUser(user)) {
				// broadcast removed user
				def data = [
					chatUsers: getStagingChatUsers(game)
				]
				addStagingUpdate(game, data)
			}
		}
	}
	
	def addStagingUpdate(Game game, Map data) {
		if(game == null || data == null) return
		
		String mapping = StagingMeteorHandler.MAPPING_GAME +"/"+ game.id
		
		log.debug "GameStagingService.addStagingUpdate: ${mapping} = ${data}"
		
		def finishedResponse = data as JSON
		metaBroadcaster.broadcastTo(mapping, finishedResponse)
	}
	
	/**
	 * Generates the staging information for the given game
	 */
	StagingGame generateStagingForGame(Game game) {
		if(game == null) return null
		
		StagingGame staging = game.staging
		if(staging == null) {
			staging = new StagingGame(game: game)
			staging.save flush:true
			
			game.staging = staging
			game.save flush:true
		}
		
		return staging
	}
	
	/**
	 * Generates the staging information for the given user
	 */
	StagingUser generateStagingForUser(StagingGame staging, MekUser userInstance) {
		if(staging == null || userInstance == null) return null
		
		StagingUser stageUser
		
		for(StagingUser stagingData in staging.stagingUsers) {
			if(stagingData.user.id == userInstance.id) {
				stageUser = stagingData
				break
			}
		}
		
		if(stageUser == null) {
			stageUser = new StagingUser(staging: staging, user: userInstance)
			staging.stagingUsers.add(stageUser)
			
			staging.save flush:true
		}
		
		return stageUser
	}
	
	/**
	 * Gets the list of names of users in the staging chat for a game
	 */
	def getStagingChatUsers(Game game) {
		def chatUsers = []
		for(MekUser user in game?.staging?.chatUsers) {
			chatUsers.add(user.toString())
		}
		
		return chatUsers
	}
}
