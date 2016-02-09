package roguemek.game

import org.atmosphere.cpr.AtmosphereResourceEvent
import org.atmosphere.cpr.AtmosphereResourceEventListenerAdapter
import org.atmosphere.cpr.Broadcaster
import org.atmosphere.cpr.BroadcasterFactory
import org.atmosphere.util.SimpleBroadcaster
import org.atmosphere.cpr.Meteor

import grails.converters.JSON

import javax.servlet.http.HttpServlet
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.atmosphere.websocket.WebSocketEventListenerAdapter
import grails.util.Holders
import static org.atmosphere.cpr.AtmosphereResource.TRANSPORT.WEBSOCKET
import static org.atmosphere.cpr.AtmosphereResource.TRANSPORT.LONG_POLLING

class ChatMeteorHandler extends HttpServlet {
	
	public static final String MAPPING_ROOT = "/atmosphere/chat"
	public static final String MAPPING_GAME = "/atmosphere/chat/game"
	
	def atmosphereMeteor = Holders.applicationContext.getBean("atmosphereMeteor")
	def gameChatService = Holders.applicationContext.getBean("gameChatService")
	
	def htmlCleaner
	
	@Override
	void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if(!gameChatService.isAuthenticated(request)) return
		
		String mapping = MAPPING_ROOT + request.getPathInfo()
		
		def session = request.getSession(false)
		if(session.game != null &&
				MAPPING_GAME.equals(mapping)){
			mapping += "/"+session.game
		}
				
		Broadcaster b = atmosphereMeteor.broadcasterFactory.lookup(SimpleBroadcaster.class, mapping, true)
		Meteor m = Meteor.build(request)

		if (m.transport().equals(WEBSOCKET)) {
			m.addListener(new WebSocketEventListenerAdapter() {
				@Override
				void onDisconnect(AtmosphereResourceEvent event) {
					gameChatService.sendDisconnectMessage(event, request)
				}
			})
		} else {
			m.addListener(new AtmosphereResourceEventListenerAdapter() {
				@Override
				void onDisconnect(AtmosphereResourceEvent event) {
					gameChatService.sendDisconnectMessage(event, request)
				}
			})
		}

		m.setBroadcaster(b)
		m.resumeOnBroadcast(m.transport() == LONG_POLLING ? true : false).suspend(-1)
	}

	@Override
	void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if(!gameChatService.isAuthenticated(request)) return
		
		String mapping = MAPPING_ROOT + request.getPathInfo()
		def session = request.getSession(false)
				
		def jsonMap = JSON.parse(request.getReader().readLine().trim()) as Map
		String type = jsonMap.containsKey("type") ? jsonMap.type.toString() : null
		String message = jsonMap.containsKey("message") ? jsonMap.message.toString() : null
		
		if (type == null || message == null) {
			gameChatService.recordIncompleteMessage(jsonMap)
		}
		else if (message.toLowerCase().contains("<script")) {
			gameChatService.recordMaliciousUseWarning(jsonMap)
		}
		else {
			def user = gameChatService.currentUser(request)
			if(user == null) return
			
			if(session.game != null &&
					MAPPING_GAME.equals(mapping)){
				mapping += "/"+session.game
				
				gameChatService.sendChat(user, jsonMap, mapping)
			}
		}
	}
}
