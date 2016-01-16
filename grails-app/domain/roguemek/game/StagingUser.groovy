package roguemek.game

import roguemek.MekUser

/** 
 * Domain class to store temporary User specific data during Game staging only
 *
 */
class StagingUser {
	
	String id
	static mapping= {
		id generator: 'uuid'
	}
	
	MekUser user
	Game game
	
	String startingLocation = Game.STARTING_RANDOM
	
	Short[] rgbCamo
	// Camo patternCamo	// TODO: add camo patterns other than solid colors
	
    static constraints = {
		user nullable: false
		game nullable: false
		
		startingLocation inList: [Game.STARTING_N, Game.STARTING_NE, Game.STARTING_E, Game.STARTING_SE,
									Game.STARTING_S, Game.STARTING_SW, Game.STARTING_W, Game.STARTING_NW,
									Game.STARTING_CENTER, Game.STARTING_RANDOM]
		
		rgbCamo nullable: true
    }
}
