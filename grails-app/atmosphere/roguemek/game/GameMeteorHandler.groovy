package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

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
import static org.atmosphere.cpr.AtmosphereResource.TRANSPORT.LONG_POLLING;

class GameMeteorHandler extends HttpServlet {
	private static Log log = LogFactory.getLog(this)
	
	public static final String MAPPING_ROOT = "/atmosphere/action"
	public static final String MAPPING_GAME = "/atmosphere/action/game"

	def atmosphereMeteor = Holders.applicationContext.getBean("atmosphereMeteor")
	def gameService = Holders.applicationContext.getBean("gameService")
	
	@Override
	void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if(!gameService.isAuthenticated(request)) return
		
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
					// nothing to see here yet
				}
			})
		} else {
			m.addListener(new AtmosphereResourceEventListenerAdapter() {
				@Override
				void onDisconnect(AtmosphereResourceEvent event) {
					// nothing to see here yet
				}
			})
		}

		m.setBroadcaster(b)
		m.resumeOnBroadcast(m.transport() == LONG_POLLING).suspend(-1)
	}

	@Override
	void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if(!gameService.isAuthenticated(request)) return
		
		String mapping = MAPPING_ROOT + request.getPathInfo()
		
		def session = request.getSession(false)
		
		def jsonMap = JSON.parse(request.getReader().readLine().trim()) as Map
		String action = jsonMap.containsKey("action") ? jsonMap.action.toString() : null
		
		if(action != null && session.game != null 
				&& MAPPING_GAME.equals(mapping)) {
			// handle connection of the user to the game chat during staging
			if(action == "connectUser") {
				log.trace "Connecting game user ${session.game}"
				gameService.sendConnect(request)
			}
			else if(action == "disconnectUser") {
				log.trace "Disconnecting game user ${session.game}"
				gameService.sendDisconnect(request)
			}
		}
		else {
			// all staging actions currently handled by the controller
			//gameService.recordUnusedData(jsonMap)
		}
	}
}
