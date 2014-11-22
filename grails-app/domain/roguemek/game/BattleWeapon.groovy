package roguemek.game

/**
 * Represents the owned Weapon that can be taken into battle and be fired
 */
class BattleWeapon extends BattleEquipment {

	Integer cooldown = 0
	
    static constraints = {
		cooldown nullable:false, min: 0
    }
	
	public String getName() {
		return this.equipment.name
	}
	
	public String getShortName() {
		return this.equipment.shortName
	}
	
	public int getDamage() {
		return this.equipment.damage
	}
	
	public int getHeat() {
		return this.equipment.heat
	}
	
	public int getCycle() {
		return this.equipment.cycle
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
}
