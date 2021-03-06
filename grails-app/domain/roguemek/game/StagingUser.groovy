package roguemek.game

import roguemek.MekUser

/** 
 * Domain class to store temporary User specific data during Game staging only
 *
 */
class StagingUser {
	
	String id
	static mapping = {
		id generator: 'uuid'
	}
	
	Game game
	MekUser user
	
	List units
	
	static hasMany = [
		units:BattleUnit
	]
	
	Boolean isReady = false
	Boolean isSpectator = false
	
	String startingLocation = Game.STARTING_RANDOM
	
	Short[] rgbCamo
	String camoFile
	
    static constraints = {
		game nullable: true
		user nullable: false
		
		startingLocation inList: [Game.STARTING_N, Game.STARTING_NE, Game.STARTING_E, Game.STARTING_SE,
									Game.STARTING_S, Game.STARTING_SW, Game.STARTING_W, Game.STARTING_NW,
									Game.STARTING_CENTER, Game.STARTING_RANDOM]
		
		rgbCamo nullable: true
		camoFile nullable: true
    }
	
	@Override
	public String toString() {
		return "<StagingUser-${id}:${user.toString()}>"
	}
}
