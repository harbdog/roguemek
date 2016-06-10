package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.scheduling.annotation.Async

import org.atmosphere.cpr.Broadcaster
import org.atmosphere.cpr.BroadcasterFactory
import grails.converters.JSON

import roguemek.MekUser
import roguemek.chat.ChatMessage

import static org.atmosphere.cpr.MetaBroadcaster.metaBroadcaster

class GameChatService extends AbstractGameService {
	private static Log log = LogFactory.getLog(this)
	
	def htmlCleaner
	def messageSource
	
	def sendChat(user, data, mapping) {
		// clean the message to not allow some markup
		def message = htmlCleaner.cleanHtml(data.message, 'simpleText')?.trim()
		if(message == null || message.length() == 0) {
			return
		}
		
		def time = new Date()
		
		// chat is to all participants
		mapping += "/*"
		
		data.message = message
		data.user = user.toString()
		data.time = time.getTime()
		
		// record in the database using async to do it in parallel to the broadcast
		recordChat(user, data, null)
		
		metaBroadcaster.broadcastTo(mapping, data)
	}
	
	def sendTeamChat(game, team, user, data, mapping) {
		// clean the message to not allow some markup
		def message = htmlCleaner.cleanHtml(data.message, 'simpleText')?.trim()
		if(game == null || message == null || message.length() == 0) {
			return
		}
		
		def time = new Date()
		
		// strip out the '/t'...'/team' portion of the message and replace with '[TEAM]'
		def teamRegex = /^(\/t\w+|\/t)/
		message = message.replaceFirst(teamRegex, "[TEAM]")
		
		data.message = message
		data.user = user.toString()
		data.time = time.getTime()
		data.recipient = team
		
		// TODO: record to the database in a way such that it won't be displayed to enemy team if they reload page
		recordChat(user, data, team)
		
		// send only to members of the team
		def teamUsers = game.getUsersForTeam(team)
		if(teamUsers == null || teamUsers.size() == 0) {
			teamUsers = [user]
		}
		
		teamUsers.each { MekUser u ->
			def userMapping = "${mapping}/${u.id}"
			metaBroadcaster.broadcastTo(userMapping, data)
		}
	}
	
	/**
	 * Asynchronously persist the chat message to the data store
	 * @param user
	 * @param data
	 * @return
	 */
	@Async
	def recordChat(user, data, recipient) {
		if(recipient < 0) recipient = null
		
		log.debug "GameChatService.recordChat - ${user}${(recipient != null) ? "@"+recipient : ""}: ${data}"
		if(data == null) return
		
		if(data.message && data.time && data.game) {
			ChatMessage chat = new ChatMessage(user: user, message: data.message, time: new Date(data.time), optGameId: data.game, recipient: recipient)
			chat.save flush: true
		}
	}

	def recordIncompleteMessage(data) {
		// This method could be used to persist errors to a data store.
		log.error "GameChatService.recordIncompleteMessage: ${data}"
	}

	def recordMaliciousUseWarning(data) {
		// This method could be used to persist potential malicious code to a data store.
		log.warn "GameChatService.recordMaliciousUseWarning: ${data}"
	}
	
	def addMessageUpdate(Game game, String messageCode, Object[] messageArgs) {
		addMessageUpdate(game, messageCode, messageArgs, new Date().getTime())
	}
	
	def addMessageUpdate(Game game, String messageCode, Object[] messageArgs, time) {
		if(game == null || messageCode == null) return
		
		String mapping = "${ChatMeteorHandler.MAPPING_GAME}/${game.id}/*"
		String message = messageSource.getMessage(messageCode, messageArgs, LocaleContextHolder.locale)
		
		log.debug "GameChatService.addMessageUpdate: ${mapping} = ${message}"
		
		def messageData = [time: time, message: message, game: game.id]
		recordChat(null, messageData, null)
		
		def chatResponse = [type: "chat", message: message, time: time] as JSON
		metaBroadcaster.broadcastTo(mapping, chatResponse)
	}

	def sendDisconnectMessage(event, request) {
		def user = currentUser(request)
		if(user == null) return
		
		// TODO: implement a way for the page to be refreshed, or game to be entered without the disconnected message always showing
		/*Object[] messageArgs = [user.toString()]
		def message = messageSource.getMessage("chat.user.disconnected", messageArgs, LocaleContextHolder.locale)
	
		def chatResponse = [type: "chat", message: message, time: new Date().getTime()] as JSON
		event.broadcaster().broadcast(chatResponse)*/
	}
}
