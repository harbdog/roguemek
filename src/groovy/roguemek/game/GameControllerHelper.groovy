package roguemek.game

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

/**
 * Class used to route to specific actions from the GameController and return the response.
 */
class GameControllerHelper {
	private static Log log = LogFactory.getLog(this)
	
	Map params
	
	Game game
	Pilot pilot
	BattleUnit unit
	String action
	
	
	public GameControllerHelper(Game g, Pilot p, BattleUnit u, Map params) {
		this.game = g
		this.pilot = p
		this.unit = u
		this.params = params
		
		// params.action is already in use by the controller action
		this.action = params.perform
	}
	
	/**
	 * Calls the method by the name of the action set in the params.perform of the request.
	 * @return The map of data to be converted to JSON at the controller back to the client.
	 */
	public def performAction() {
		if(this.action == null) return
		return this."$action"()
	}
	
	/**
	 * Handles the constant long polling from each client to await updates to the game.
	 * @return The map of messages to be converted to JSON at the controller back to the client.
	 */
	public def performPoll() {
		//Date lastUpdate = this.pilot.lastUpdate
		Date lastUpdate = GameMessage.addMessageUpdates(this.game)
		return [date: lastUpdate]
	}
	
	/**
	 * Handles the case where the action called to be performed does not exist as a method.
	 * @param name
	 * @param args
	 * @return
	 */
	private def methodMissing(String name, args) {
		log.error("Missing action name="+name+", args="+args)
		
		// TODO: return with some error game message about missing action
	}
	
	private def move() {
		if(this.unit == null) return
		
		boolean forward = (params.forward != null) ? params.forward : true
		boolean jumping = (params.jumping != null) ? params.jumping : false
		
		return new GameHelper(this.game).move(this.unit, forward, jumping)
	}
	
	private def rotate() {
		if(this.unit == null) return
		
		boolean rotation = (params.rotation != null) ? Boolean.valueOf(params.rotation) : true
		boolean jumping = (params.jumping != null) ? params.jumping : false
		
		if(rotation) {
			return new GameHelper(this.game).rotateHeadingCW(this.unit, jumping)
		}
		else {
			return new GameHelper(this.game).rotateHeadingCCW(this.unit, jumping)
		}
	}
}
