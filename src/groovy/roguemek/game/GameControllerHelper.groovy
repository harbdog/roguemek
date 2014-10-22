package roguemek.game

import org.springframework.transaction.annotation.Transactional
import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

/**
 * Class used to route to specific actions from the GameController and return the response.
 */
@Transactional
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
		
		// TODO: only allow certain actions during another player's turn (do not allow move, rotate, skip when not their turn)
		
		return this."$action"()
	}
	
	/**
	 * Handles the constant long polling from each client to await updates to the game.
	 * @return The map of messages to be converted to JSON at the controller back to the client.
	 */
	public def performPoll() {
		Date lastUpdate = this.pilot.lastUpdate
		
		int tries = 0
		
		while(true) {
			if(tries >= 50) {
				// give up and respond with no data after so many tries otherwise 
				// the client will assume the worst and start a new poll thread
				break
			}
			
			ArrayList updates = GameMessage.getMessageUpdates(lastUpdate, this.game)
			
			// set the pilot last update time to the last message's time
			if(updates != null && !updates.isEmpty()) {
				log.info("UPDATES: "+updates)
				
				lastUpdate = new Date(updates.last().getTime())
				this.pilot.lastUpdate = lastUpdate
				this.pilot.save flush: true
				
				return [date: lastUpdate, updates: updates]
			}
			
			tries ++
			Thread.sleep(500)
		}
		
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
	
	/**
	 * Request from the client to move the unit forward/backward
	 * @return
	 */
	private def move() {
		if(this.unit == null) return
		
		boolean forward = params.boolean('forward')
		boolean jumping = params.boolean('jumping')
		
		return new GameHelper(this.game).move(this.unit, forward, jumping)
	}
	
	/**
	 * Request from the client to rotate the unit CW/CCW
	 * @return
	 */
	private def rotate() {
		if(this.unit == null) return
		
		boolean rotation = params.boolean('rotation')
		boolean jumping = params.boolean('jumping')
		
		if(rotation) {
			return new GameHelper(this.game).rotateHeadingCW(this.unit, jumping)
		}
		else {
			return new GameHelper(this.game).rotateHeadingCCW(this.unit, jumping)
		}
	}
	
	/**
	 * Request from the client to fire a weapons at the target
	 * @return
	 */
	private def fire_weapons() {
		if(this.unit == null) return
		
		String targetId = params.target_id
		BattleUnit target = BattleUnit.get(targetId)
		
		ArrayList weapons = new ArrayList()
		for(id in params.list('weapon_ids[]')) {
			BattleWeapon w = BattleWeapon.get(id)
			log.info("Firing "+w+" @ "+target)
			
			weapons.add(w)
		}
		
		
		if(weapons == null || target == null) {
			return
		}
		
		return new GameHelper(this.game).fireWeaponsAtUnit(this.unit, weapons, target);
	}
	
	/**
	 * Request from the client to skip the remainder of their turn
	 * @return
	 */
	private def skip() {
		if(this.unit == null) return
		
		return new GameHelper(this.game).initializeNextTurn()
	}
}
