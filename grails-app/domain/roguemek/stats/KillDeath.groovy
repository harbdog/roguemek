package roguemek.stats

import java.util.Date

import roguemek.MekUser
import roguemek.game.Game
import roguemek.model.Unit

class KillDeath {
	private static final Date NULL_DATE = new Date(0)

	String id
	
	Game game
	Date time = NULL_DATE
	
	MekUser killer
	Unit killerUnit
	MekUser victim
	Unit victimUnit
	
	static mapping = {
		id generator: 'uuid'
		version false
	}
	
    static constraints = {
		// if a unit is destroyed through self damage, no killer is set
		killer nullable: true
		killerUnit nullable:true
	}
	
	def beforeInsert() {
		if (time == NULL_DATE) {
			time = new Date()
		}
	}
}
