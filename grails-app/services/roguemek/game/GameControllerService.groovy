package roguemek.game

import grails.transaction.Transactional
import roguemek.MekUser

@Transactional
class GameControllerService {
	GameService gameService
	
	/**
	 * Handles the constant long polling from each client to await updates to the game.
	 * @return The map of messages to be converted to JSON at the controller back to the client.
	 */
	public def performPoll(Game game, MekUser user) {
		Pilot pilot = game.getPrimaryPilotForUser(user)
		if(pilot == null) return
		
		Date lastUpdate = pilot.lastUpdate
		
		int tries = 0
		
		while(true) {
			if(tries >= 40) {
				// give up and respond with no data after so many tries otherwise
				// the client will assume the worst and start a new poll thread
				break
			}
			
			ArrayList updates = GameMessage.getMessageUpdates(game, lastUpdate)
			
			// set the pilot last update time to the last message's time
			if(updates != null && !updates.isEmpty()) {
				lastUpdate = new Date(updates.last().getTime())
				
				try{
					Pilot p = Pilot.get(pilot.id)
					p.lastUpdate = lastUpdate
					p.save flush: true
				} catch(Exception e) {
					// StaleObjectStateException can occur when page is refreshed 
					return [terminated: true]
				}
				
				return [date: lastUpdate, messageUpdates: updates]
			}
			
			tries ++
			Thread.sleep(250)
		}
		
		return [date: lastUpdate]
	}
	
	/**
	 * Calls the method by the name of the action set in the params.perform of the request.
	 * @return The map of data to be converted to JSON at the controller back to the client.
	 */
	public def performAction(Game game, MekUser user, Map params) {
		// Need to determine what pilot and unit to pass along to the action
		Pilot pilot
		BattleUnit unit
		
		// Test to see if the current turn's unit is owned by the user
		BattleUnit turnUnit = game.getTurnUnit()
		Pilot turnPilot = turnUnit.pilot
		
		if(user == turnUnit.pilot.ownerUser) {
			unit = turnUnit
			pilot = turnUnit.pilot
		}
		else{
			// Set the pilot and unit reference to the primary pilot
			pilot = game.getPrimaryPilotForUser(user)
			unit = game.getPrimaryUnitForUser(user)
		}
		
		String action = params.perform
		if(action == null || pilot == null || unit == null) return
		
		// TODO: only allow certain actions during another player's turn (do not allow move, rotate, skip when not their turn)
		return this."$action"(game, pilot, unit, params)
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
	private def move(Game game, Pilot pilot, BattleUnit unit, Map params) {
		boolean forward = params.boolean('forward')
		boolean jumping = params.boolean('jumping')
		
		return gameService.move(game, unit, forward, jumping)
	}
	
	/**
	 * Request from the client to begin or end jump movement
	 * @return
	 */
	private def jump(Game game, Pilot pilot, BattleUnit unit, Map params) {
		boolean jumping = params.boolean('jumping')
		
		return gameService.toggleJumping(game, unit, jumping)
	}
	
	/**
	 * Request from the client to rotate the unit CW/CCW
	 * @return
	 */
	private def rotate(Game game, Pilot pilot, BattleUnit unit, Map params) {
		boolean rotation = params.boolean('rotation')
		boolean jumping = params.boolean('jumping')
		
		if(rotation) {
			return gameService.rotateHeadingCW(game, unit, jumping)
		}
		else {
			return gameService.rotateHeadingCCW(game, unit, jumping)
		}
	}
	
	/**
	 * Request from the client to fire a weapons at the target
	 * @return
	 */
	private def fire_weapons(Game game, Pilot pilot, BattleUnit unit, Map params) {
		String targetId = params.target_id
		BattleUnit target = BattleUnit.get(targetId)
		
		ArrayList weapons = new ArrayList()
		for(id in params.list('weapon_ids[]')) {
			BattleWeapon w = BattleWeapon.get(id)
			
			weapons.add(w)
		}
		
		
		if(weapons == null || target == null) {
			return
		}
		
		return gameService.fireWeaponsAtUnit(game, unit, weapons, target)
	}
	
	/**
	 * Request from the client to skip the remainder of their turn
	 * @return
	 */
	private def skip(Game game, Pilot pilot, BattleUnit unit, Map params) {
		return gameService.skipTurn(game, unit)
	}
	
	/**
	 * Request from the client to acquire the target
	 * @param game
	 * @param pilot
	 * @param unit
	 * @param params
	 * @return
	 */
	private def target(Game game, Pilot pilot, BattleUnit unit, Map params) {
		String targetId = params.target_id
		BattleUnit target = BattleUnit.read(targetId)
		
		if(target == null) {
			return
		}
		
		return gameService.targetUnitInfo(game, unit, target)
	}
	
	/**
	 * Developer use only 
	 * Example usage, from javascript console:
	 * 	   handleActionJSON({perform: "devDamageTarget", target_id: "402880e9502e0b1b01502e0b9459061d", hitLocation: 3, damage: 2});
	 * @param game
	 * @param pilot
	 * @param unit
	 * @param params
	 * @return
	 */
	private def devDamageTarget(Game game, Pilot pilot, BattleUnit unit, Map params) {
		String damage = params.damage
		String hitLocation = params.hitLocation
		String targetId = params.target_id
		
		BattleUnit target = BattleUnit.get(targetId)
		if(target == null || damage == null || hitLocation == null) {
			return
		}
		
		return gameService.devDamageTarget(game, Integer.valueOf(damage), target, Integer.valueOf(hitLocation))
	}
	
	/**
	 * Developer use only
	 * Example usage, from javascript console:
	 * 	   handleActionJSON({perform: "devCritTarget", target_id: "402880e9502e0b1b01502e0b9459061d", hitLocation: 4, crits: 1});
	 * @param game
	 * @param pilot
	 * @param unit
	 * @param params
	 * @return
	 */
	private def devCritTarget(Game game, Pilot pilot, BattleUnit unit, Map params) {
		String crits = params.crits
		String hitLocation = params.hitLocation
		String targetId = params.target_id
		
		BattleUnit target = BattleUnit.get(targetId)
		if(target == null || crits == null || hitLocation == null) {
			return
		}
		
		return gameService.devCritTarget(game, Integer.valueOf(crits), target, Integer.valueOf(hitLocation))
	}
	
	/**
	 * Developer use only
	 * Example usage, from javascript console:
	 * 	   handleActionJSON({perform: "devTripTarget", target_id: "402880e9502e0b1b01502e0b9459061d"});
	 * @param game
	 * @param pilot
	 * @param unit
	 * @param params
	 * @return
	 */
	private def devTripTarget(Game game, Pilot pilot, BattleUnit unit, Map params) {
		String targetId = params.target_id
		
		BattleUnit target = BattleUnit.get(targetId)
		if(target == null) {
			return
		}
		
		return gameService.devTripTarget(game, target)
	}
}
