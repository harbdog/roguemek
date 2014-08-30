package roguemek.game

import roguemek.model.Equipment

/**
 * Represents the owned equipment that can be taken into battle and be damaged or destroyed
 */
class BattleEquipment {

	Pilot ownerPilot
	Equipment equipment
	
	Integer criticalHits = 0
	Character status = STATUS_ACTIVE
	
	// STATIC value mappings
	static Character STATUS_ACTIVE = 'A'
	static Character STATUS_DESTROYED = 'D'
	static Character STATUS_DAMAGED = 'R'
	
    static constraints = {
		ownerPilot nullable: false
		equipment nullable: false
		
		criticalHits min: 0
		status inList: [STATUS_ACTIVE, STATUS_DESTROYED, STATUS_DAMAGED]
    }
	
	@Override
	public String toString() {
		return equipment?.name
	}
}
