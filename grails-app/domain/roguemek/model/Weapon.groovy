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
		
		// Create all objects for the game from csv
		new CSVMapReader(new FileReader("src/csv/Weapons.csv")).eachLine { map ->
			
			// update the ammoTypes to be a map of the Ammo class by shortName
			def ammoTypesStr = map.ammoTypes
			if(ammoTypesStr != null) {
				
				def ammoTypesArr = []
				ammoTypesStr.split(":").each {
					def itAmmo = Ammo.findByShortName(it)
					if(itAmmo != null) {
						ammoTypesArr.add(itAmmo)
					}
				}
				map.ammoTypes = ammoTypesArr
			}
			
			def weapon = new Weapon(map)
			if(!weapon.validate()) {
				log.error("Errors with weapon "+weapon.name+":\n")
				weapon.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				weapon.save flush:true
				log.info("Created weapon "+weapon.name)
			}
		}
		
	}
}
