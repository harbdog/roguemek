package roguemek.model

import org.grails.plugins.csv.CSVMapReader

class Weapon extends Equipment {
		
	Integer damage
	Integer heat
	Integer cycle
	
	Integer projectiles
	static hasMany = [ammoTypes:Ammo]
	
	Integer minRange
	Integer shortRange
	Integer mediumRange
	Integer longRange

    static constraints = {
		damage min: 0
		heat min: 0
		cycle min: 1
		
		projectiles min: 1
		ammoTypes nullable: true
		
		minRange min: 0
		shortRange min: 0
		mediumRange min: 0
		longRange min: 0
    }
	
	static void initWeapons() {
		def defaultWeapon = Weapon.findByName("Small Laser")
		if(defaultWeapon != null) {
			return
		}
		
		// Create all factions for the game from csv
		new CSVMapReader(new FileReader("src/csv/Weapons.csv")).eachLine { map ->
			def weapon = new Weapon(map)
			
			if(!weapon.validate()) {
				log.error("Errors with weapon "+weapon.name+":\n")
				weapon.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				weapon.save()
				log.info("Created weapon "+weapon.name)
			}
		}
		
	}
}
