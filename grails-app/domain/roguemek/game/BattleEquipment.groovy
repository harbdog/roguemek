package roguemek.game

import roguemek.model.*

/**
 * Represents the owned Equipment that can be taken into battle and be damaged or destroyed
 */
class BattleEquipment {
	
	String id
	static mapping= {
		id generator: 'uuid'
	}

	Pilot ownerPilot
	Equipment equipment
	
	Integer location
	Byte[] criticalHits = []
	Character status = STATUS_ACTIVE
	
	// STATIC value mappings
	static Character STATUS_ACTIVE = 'A'
	static Character STATUS_DESTROYED = 'D'
	static Character STATUS_DAMAGED = 'R'
	
    static constraints = {
		ownerPilot nullable: false
		equipment nullable: false
		
		location inList: Mech.ALL_LOCATIONS
		criticalHits nullable: false
		status inList: [STATUS_ACTIVE, STATUS_DESTROYED, STATUS_DAMAGED]
    }
	
	@Override
	public String toString() {
		return getName()
	}
	
	public String getName() {
		return equipment?.name
	}
	
	public boolean isActive() {
		return status == STATUS_ACTIVE
	}
	
	public boolean isDamaged() {
		return status == STATUS_DAMAGED
	}
	
	public boolean isDestroyed() {
		return status == STATUS_DESTROYED
	}
}
