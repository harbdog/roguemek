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
import static org.atmosphere.cpr.AtmosphereResource.TRANSPORT.LONG_POLLING;

class StagingMeteorHandler extends HttpServlet {
	
	public static final String MAPPING_ROOT = "/atmosphere/staging"
	public static final String MAPPING_GAME = "/atmosphere/staging/game"

	def atmosphereMeteor = Holders.applicationContext.getBean("atmosphereMeteor")
	def gameStagingService = Holders.applicationContext.getBean("gameStagingService")
	
	@Override
	void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if(!gameStagingService.isAuthenticated(request)) return
		
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
					gameStagingService.sendDisconnect(event, request)
				}
			})
		} else {
			m.addListener(new AtmosphereResourceEventListenerAdapter() {
				@Override
				void onDisconnect(AtmosphereResourceEvent event) {
					gameStagingService.sendDisconnect(event, request)
				}
			})
		}

		m.setBroadcaster(b)
		m.resumeOnBroadcast(m.transport() == LONG_POLLING ? true : false).suspend(-1)
	}

	@Override
	void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
		if(!gameStagingService.isAuthenticated(request)) return
		
		String mapping = MAPPING_ROOT + request.getPathInfo()
		
		def session = request.getSession(false)
		
		def jsonMap = JSON.parse(request.getReader().readLine().trim()) as Map
		
		// all staging actions currently handled by the controller
		gameStagingService.recordUnusedData(jsonMap)
		
		/*if(action == null) {
			gameStagingService.recordIncompleteData(jsonMap)
		} 
		else if(session.game != null &&
				MAPPING_GAME.equals(mapping)){
			// if there was something to do here
		}*/
	}
}
