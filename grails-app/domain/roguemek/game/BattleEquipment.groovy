package roguemek.game

import roguemek.MekUser
import roguemek.model.*

/**
 * Represents the owned Equipment that can be taken into battle and be damaged or destroyed
 */
class BattleEquipment {
	
	String id
	static mapping= {
		id generator: 'uuid'
	}

	MekUser ownerUser
	Equipment equipment
	
	Integer location
	Boolean[] criticalHits = []
	Character status = STATUS_ACTIVE
	
	// STATIC value mappings
	public static final Character STATUS_ACTIVE = 'A'
	public static final Character STATUS_DESTROYED = 'D'
	public static final Character STATUS_DAMAGED = 'R'
	
	private static BattleEquipment emptyEquip
	
    static constraints = {
		ownerUser nullable: true
		equipment nullable: false
		
		location nullable: true, inList: Mech.ALL_LOCATIONS
		criticalHits nullable: false
		status inList: [STATUS_ACTIVE, STATUS_DESTROYED, STATUS_DAMAGED]
    }
	
	public String getName() {
		return equipment?.name
	}
	
	public int getCrits() {
		return equipment?.crits
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
	
	public boolean isEmpty() {
		return Equipment.EMPTY.equals(this.equipment.name)
	}
	
	public static BattleEquipment getEmpty() {
		if(emptyEquip == null) {
			Equipment e = Equipment.getEmpty()
			emptyEquip = (e != null) ? BattleEquipment.findByEquipment(e) : null
		}
		return emptyEquip
	}
	
	@Override
	public String toString() {
		return getName()
	}
}
