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
	
	def recordIncompleteData(data) {
		// This method could be used to persist errors to a data store.
		log.error "GameStagingService.recordIncompleteMessage: ${data}"
	}

	def recordMaliciousUseData(data) {
		// This method could be used to persist potential malicious code to a data store.
		log.warn "GameStagingService.recordMaliciousUseWarning: ${data}"
	}
	
	def sendDisconnect(event, request) {
		def user = currentUser(request)
		if(user == null) return
		
		/*Object[] messageArgs = [user.toString()]
		def message = messageSource.getMessage("chat.user.disconnected", messageArgs, LocaleContextHolder.locale)
	
		def chatResponse = [type: "chat", message: message] as JSON
		event.broadcaster().broadcast(chatResponse)*/
	}
	
	def performAction(Game game, MekUser user, Map data) {
		log.info "GameStagingService.performAction.${data.action}: ${game?.id} @ ${user} = ${data}"
		
		String action = data.action
		
		return this."$action"(game, user, data)
	}
	
	def addStagingUpdate(Game game, Map data) {
		if(game == null || data == null) return
		
		String mapping = StagingMeteorHandler.MAPPING_GAME +"/"+ game.id
		
		log.info "GameStagingService.addStagingUpdate: ${mapping} = ${data}"
		
		def finishedResponse = data as JSON
		metaBroadcaster.broadcastTo(mapping, finishedResponse)
		
		// TODO: try turning off sessions for atmosphere, since the sample works fine with this stuff
	}
}
