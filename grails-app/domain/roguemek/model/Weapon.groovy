package roguemek.model

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class Weapon extends Equipment {
	String weaponType
	
	Integer damage
	Integer heat
	Integer cycle
	
	Integer clusterHits
	Integer projectiles
	static hasMany = [ammoTypes:Ammo]
	
	Integer minRange
	Integer shortRange
	Integer mediumRange
	Integer longRange

	public static final String TYPE_ENERGY = "Energy"
	public static final String TYPE_BALLISTIC = "Ballistic"
	public static final String TYPE_MISSILE = "Missile"
	public static final String TYPE_PHYSICAL = "Physical"
	
    static constraints = {
		weaponType inList: [TYPE_ENERGY, TYPE_BALLISTIC, TYPE_MISSILE, TYPE_PHYSICAL]
		
		damage min: 0
		heat min: 0
		cycle min: 1
		
		clusterHits min: 1
		projectiles min: 1
		
		minRange min: 0
		shortRange min: 0
		mediumRange min: 0
		longRange min: 0
    }
	
	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}
	
	static void init() {
		def defaultWeapon = Weapon.findByName("Small Laser")
		if(defaultWeapon != null) {
			return
		}
		
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/Weapons.csv"))).eachLine { map ->
			
			// update Aliases to be multiple strings in an array instead of one string
			Weapon.updateAliases(map)
			
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
