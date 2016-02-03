package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.security.core.context.SecurityContext
import org.springframework.security.web.context.HttpSessionSecurityContextRepository

import grails.converters.JSON

import roguemek.MekUser

class GameChatService {
	private static Log log = LogFactory.getLog(this)
	
	def messageSource
	
	def recordChat(user, data) {
		// This method could be used to persist chat messages to a data store.
		log.info "GameChatService.recordChat - ${user}: ${data}"
	}

	def recordIncompleteMessage(data) {
		// This method could be used to persist errors to a data store.
		log.error "Error GameChatService.recordIncompleteMessage: ${data}"
	}

	def recordMaliciousUseWarning(data) {
		// This method could be used to persist potential malicious code to a data store.
		log.warn "Warning GameChatService.recordMaliciousUseWarning: ${data}"
	}

	def sendDisconnectMessage(event, request) {
		def user = currentUser(request)
		if(user == null) return
		
		Object[] messageArgs = [user.toString()]
		def message = messageSource.getMessage("chat.user.disconnected", messageArgs, LocaleContextHolder.locale)
	
		def chatResponse = [type: "chat", message: message] as JSON
		event.broadcaster().broadcast(chatResponse)
	}
	
	def currentUser(request) {
		def httpSession = request?.getSession(false)
		def context = (SecurityContext) httpSession?.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY)
		if (context?.authentication?.isAuthenticated()) {
			return MekUser.get(context.authentication.principal.id)
		}
		
		return null
	}
}
