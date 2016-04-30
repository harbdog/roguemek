package roguemek.game

import roguemek.MekUser

class GameTeam {

    String id
	static mapping= {
		id generator: 'uuid'
		version false
	}
	
	Game game
	MekUser user
    Integer team
	
	static constraints = {
		game nullable: false
		user nullable: false
        team nullable: false, min: 1
	}
}
