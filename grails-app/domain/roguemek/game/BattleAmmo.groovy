package roguemek.game

import roguemek.model.Ammo

/**
 * Represents the owned Ammo that can be taken into battle and be consumed
 */
class BattleAmmo extends BattleEquipment {

	Integer ammoRemaining
	
    static constraints = {
		ammoRemaining nullable: false, min: 0
    }
	
	def beforeValidate() {
		if(equipment instanceof Ammo && ammoRemaining == null) {
			ammoRemaining = getAmmoPerTon()
		}
	}
	
	public int getAmmoPerTon() {
		return this.equipment.ammoPerTon
	}
	
	public boolean isExplosive() {
		return (this.equipment.explosiveDamage > 0)
	}
	public int getExplosiveDamage() {
		return this.equipment.explosiveDamage
	}
}
