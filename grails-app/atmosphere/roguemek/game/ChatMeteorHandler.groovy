package roguemek.game

import org.atmosphere.cpr.AtmosphereResourceEvent
import org.atmosphere.cpr.AtmosphereResourceEventListenerAdapter
import org.atmosphere.cpr.Broadcaster
import org.atmosphere.cpr.BroadcasterFactory
import org.atmosphere.cpr.DefaultBroadcaster
import org.atmosphere.cpr.Meteor

import grails.converters.JSON

import javax.servlet.http.HttpServlet
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse

import org.atmosphere.websocket.WebSocketEventListenerAdapter
import grails.util.Holders
import static org.atmosphere.cpr.AtmosphereResource.TRANSPORT.WEBSOCKET

class ChatMeteorHandler extends HttpServlet {
	
	public static final String CHAT_MAPPING_ROOT = "/atmosphere/chat"
	public static final String CHAT_MAPPING_GAME = "/atmosphere/chat/game"
	
	def atmosphereMeteor = Holders.applicationContext.getBean("atmosphereMeteor")
	def gameChatService = Holders.applicationContext.getBean("gameChatService")
	
	@Override
	void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		def user = gameChatService.currentUser(request)
		if(user == null) return
		
		String mapping = CHAT_MAPPING_ROOT + request.getPathInfo()
		
		def session = request.getSession(false)
		if(session.game != null &&
				CHAT_MAPPING_GAME.equals(mapping)){
			mapping += "/"+session.game
		}
				
		Broadcaster b = atmosphereMeteor.broadcasterFactory.lookup(DefaultBroadcaster.class, mapping, true)
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
	}

	@Override
	void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
		String mapping = CHAT_MAPPING_ROOT + request.getPathInfo()
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
					CHAT_MAPPING_GAME.equals(mapping)){
				mapping += "/"+session.game
				
				jsonMap.user = user.toString()
				
				// TODO: actually record in the database, use async to do it in parallel to the broadcast?
				gameChatService.recordChat(user, jsonMap)
				
				Broadcaster b = atmosphereMeteor.broadcasterFactory.lookup(DefaultBroadcaster.class, mapping)
				b.broadcast(jsonMap)
			}
		}
	}
}
