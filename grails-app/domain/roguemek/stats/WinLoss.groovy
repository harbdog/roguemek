package roguemek.stats

import java.util.Date

import roguemek.MekUser
import roguemek.game.Game

class WinLoss {
	private static final Date NULL_DATE = new Date(0)

	String id
	
	Game game
	Date time = NULL_DATE
	
	MekUser user
	Boolean winner
	
	static mapping = {
		id generator: 'uuid'
		version false
	}
	
    static constraints = {}
	
	def beforeInsert() {
		if (time == NULL_DATE) {
			time = new Date()
		}
	}
}
