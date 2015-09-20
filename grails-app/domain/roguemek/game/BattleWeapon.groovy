package roguemek.game

/**
 * Represents the owned Weapon that can be taken into battle and be fired
 */
class BattleWeapon extends BattleEquipment {

	Integer cooldown = 0
	Integer actualDamage
	
    static constraints = {
		cooldown nullable:false, min: 0
		actualDamage nullable: true
    }
	
	public String getName() {
		return this.equipment.name
	}
	
	public String getShortName() {
		return this.equipment.shortName
	}
	
	public int getDamage() {
		if(this.actualDamage != null) return actualDamage
		
		return this.equipment.damage
	}
	
	public int getHeat() {
		return this.equipment.heat
	}
	
	public int getCycle() {
		return this.equipment.cycle
	}
	
	public int getClusterHits() {
		return this.equipment.clusterHits
	}
	
	public int getProjectiles() {
		return this.equipment.projectiles
	}
	
	public int getMinRange() {
		return this.equipment.minRange
	}
	
	public int getShortRange() {
		return this.equipment.shortRange
	}
	
	public int getMediumRange() {
		return this.equipment.mediumRange
	}
	
	public int getLongRange() {
		return this.equipment.longRange
	}
	
	public int[] getRanges() {
		return [this.getShortRange(), this.getMediumRange(), this.getLongRange()]
	}
	
	public boolean isLRM() {
		// TODO: come up with a better way to determine if a weapon is an LRM type
		return this.getShortName().startsWith("LRM")
	}
	
	public boolean isPhysical() {
		return this.equipment.weaponType?.equals("Physical")
	}
	
	public boolean isHatchet() {
		// TODO: come up with a better way to determine if a weapon is a Hatchet
		return this.getShortName().startsWith("HATCHET")
	}
	
	public boolean isPunch() {
		// TODO: come up with a better way to determine if a weapon is a Punch
		return this.getShortName().startsWith("PUNCH")
	}
	
	public boolean isKick() {
		// TODO: come up with a better way to determine if a weapon is a Kick
		return this.getShortName().startsWith("KICK")
	}
	
	public boolean isCharge() {
		// TODO: come up with a better way to determine if a weapon is a Charge
		return this.getShortName().startsWith("CHARGE")
	}
	
	public boolean isDFA() {
		// TODO: come up with a better way to determine if a weapon is a DFA
		return this.getShortName().startsWith("DFA")
	}
	
	public def getAmmoTypes() {
		return this.equipment.ammoTypes
	}
}
