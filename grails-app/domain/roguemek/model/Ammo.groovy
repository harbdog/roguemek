package roguemek.model

import java.io.File

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class Ammo extends Equipment {

	Integer ammoPerTon
	Integer explosiveDamage
	
	static belongsTo = Weapon
	
    static constraints = {
		ammoPerTon min: 1
		explosiveDamage nullable: false, min: 0
    }
	
	static void init() {
		def defaultAmmo = Ammo.findByName("Auto Cannon 20 Ammo")
		if(defaultAmmo != null) {
			return
		}
		
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/Ammo.csv"))).eachLine { map ->
			
			// update Aliases to be multiple strings in an array instead of one string
			Ammo.updateAliases(map)
			
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
