package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import org.springframework.context.i18n.LocaleContextHolder

import org.atmosphere.cpr.Broadcaster
import org.atmosphere.cpr.BroadcasterFactory
import grails.converters.JSON

import roguemek.MekUser

import static org.atmosphere.cpr.MetaBroadcaster.metaBroadcaster

class GameChatService extends AbstractGameService {
	private static Log log = LogFactory.getLog(this)
	
	def htmlCleaner
	def messageSource
	
	def sendChat(user, data, mapping) {
		// clean the message to not allow some markup
		def message = htmlCleaner.cleanHtml(data.message, 'simpleText')
		data.message = message
		
		data.user = user.toString()
		data.time = new Date().getTime()
		
		// TODO: actually record in the database, use async to do it in parallel to the broadcast?
		recordChat(user, data)
		
		metaBroadcaster.broadcastTo(mapping, data)
	}
	
	def recordChat(user, data) {
		// This method could be used to persist chat messages to a data store.
		log.info "GameChatService.recordChat - ${user}: ${data}"
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
		
		String mapping = ChatMeteorHandler.MAPPING_GAME +"/"+ game.id
		String message = messageSource.getMessage(messageCode, messageArgs, LocaleContextHolder.locale)
		
		log.debug "GameChatService.addMessageUpdate: ${mapping} = ${message}"
		
		def chatResponse = [type: "chat", message: message, time: time] as JSON
		metaBroadcaster.broadcastTo(mapping, chatResponse)
	}

	def sendDisconnectMessage(event, request) {
		def user = currentUser(request)
		if(user == null) return
		
		Object[] messageArgs = [user.toString()]
		def message = messageSource.getMessage("chat.user.disconnected", messageArgs, LocaleContextHolder.locale)
	
		def chatResponse = [type: "chat", message: message, time: new Date().getTime()] as JSON
		event.broadcaster().broadcast(chatResponse)
	}
}
