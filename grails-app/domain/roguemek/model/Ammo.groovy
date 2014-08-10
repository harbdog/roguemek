package roguemek.model

import org.grails.plugins.csv.CSVMapReader

class Ammo extends Equipment {

	Integer ammoPerTon
	Boolean explosive
	
	static belongsTo = Weapon
	
    static constraints = {
		ammoPerTon min: 1
		explosive nullable: false
    }
	
	static void initAmmo() {
		def defaultAmmo = Ammo.findByName("Auto Cannon 20 Ammo")
		if(defaultAmmo != null) {
			return
		}
		
		// Create all objects for the game from csv
		new CSVMapReader(new FileReader("src/csv/Ammo.csv")).eachLine { map ->
			
			def ammo = new Ammo(map)
			
			if(!ammo.validate()) {
				log.error("Errors with ammo "+ammo.name+":\n")
				ammo.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				ammo.save flush:true
				log.info("Created ammo "+ammo.name)
			}
		}
	}
}
