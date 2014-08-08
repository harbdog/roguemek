package roguemek

class Weapon extends Equipment {
		
	Integer damage
	Integer heat
	Integer cooldown
	
	Integer projectiles
	static hasMany = [ammoTypes:Ammo]
	
	Integer minRange
	Integer shortRange
	Integer mediumRange
	Integer longRange

    static constraints = {
		damage min: 0
		heat min: 0
		cooldown min: 1
		
		projectiles min: 1
		ammoTypes nullable: true
		
		minRange min: 0
		shortRange min: 0
		mediumRange min: 0
		longRange min: 0
    }
}
