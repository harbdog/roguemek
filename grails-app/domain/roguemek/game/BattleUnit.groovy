package roguemek.game

/**
 * Represents the owned unit that can be taken into battle as a base class for BattleMech, BattleTank, etc
 */
class BattleUnit {

	Pilot ownerPilot
	
	Character status = STATUS_ACTIVE
	
	// STATIC value mappings
	static Character STATUS_ACTIVE = 'A'
	static Character STATUS_DESTROYED = 'D'
	
	static mapping = {
		// All extending classes will get their own tables
		tablePerHierarchy false
	}
	
    static constraints = {
		ownerPilot nullable: true
    }
	
	@Override
	public String toString() {
		return "Unit owned by "+ownerPilot?.toString()
	}
}
