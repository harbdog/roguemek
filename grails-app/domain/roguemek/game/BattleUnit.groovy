package roguemek.game

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

/**
 * Represents the owned unit that can be taken into battle as a base class for BattleMech, BattleTank, etc
 */
class BattleUnit {
	private static Log log = LogFactory.getLog(this)

	Pilot ownerPilot
	
	Game battleGame
	Integer x
	Integer y
	
	Character status = STATUS_ACTIVE
	
	String image
	
	// STATIC value mappings
	public static final Character STATUS_ACTIVE = 'A'
	public static final Character STATUS_DESTROYED = 'D'
	
	static mapping = {
		// All extending classes will get their own tables
		tablePerHierarchy false
	}
	
    static constraints = {
		ownerPilot nullable: true
		battleGame nullable: true
		x nullable: true
		y nullable: true
		
		image nullable: false
		
		status inList: [STATUS_ACTIVE, STATUS_DESTROYED]
    }
	
	@Override
	public String toString() {
		return "Unit owned by "+ownerPilot?.toString()
	}
}
