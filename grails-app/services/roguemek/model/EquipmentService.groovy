package roguemek.model

import groovy.sql.Sql
import grails.transaction.Transactional
import org.grails.plugins.csv.CSVMapReader

import roguemek.assets.ContextHelper

@Transactional
class EquipmentService {

	def dataSource

	def initEquipment() {
		// using Groovy SQL batch insert methods to load faster
		def sql = new Sql(dataSource)

        // Create all generic Equipment for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/Equipment.csv"))).eachLine { map ->
			def equip = Equipment.findByName(map.name)
			if(equip) return
			
			// update Aliases to be multiple strings in an array instead of one string
			Equipment.updateAliases(map)
			
			equip = new Equipment(map)
			
			if(!equip.validate()) {
				log.error("Errors with equipment "+equip.name+":\n")
				equip.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				equip.save()
				log.info("Created equipment "+equip.name)
			}
		}

        // Create JumpJets from csv
        initJumpJets()

        // Create HeatSinks from csv
        initHeatSinks()

        // Create Ammo from csv
        initAmmo()

        // Create Weapons from csv
        initWeapons()
	}
	
	private def initJumpJets() {
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/JumpJets.csv"))).eachLine { map ->
			// using name and mass since Jump Jets have the same name but differ in mass based on mech tonnage
			def jumpjet = JumpJet.findByNameAndMass(map.name, map.mass)
			if(jumpjet) return

			// update Aliases to be multiple strings in an array instead of one string
			JumpJet.updateAliases(map)

			jumpjet = new JumpJet(map)

			if(!jumpjet.validate()) {
				log.error("Errors with jumpjet "+jumpjet.name+":\n")
				jumpjet.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				jumpjet.save()
				log.info("Created jumpjet "+jumpjet.name)
			}
		}
	}
	
	private def initHeatSinks() {
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/HeatSinks.csv"))).eachLine { map ->
			def heatsink = HeatSink.findByName(map.name)
			if(heatsink) return
			
			// update Aliases to be multiple strings in an array instead of one string
			HeatSink.updateAliases(map)
			
			heatsink = new HeatSink(map)
			
			if(!heatsink.validate()) {
				log.error("Errors with heatsink "+heatsink.name+":\n")
				heatsink.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				heatsink.save()
				log.info("Created heatsink "+heatsink.name)
			}
		}
	}
	
	private def initAmmo() {
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/Ammo.csv"))).eachLine { map ->
			def ammo = Ammo.findByName(map.name)
			if(ammo) return
			
			// update Aliases to be multiple strings in an array instead of one string
			Ammo.updateAliases(map)
			
			ammo = new Ammo(map)
			
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
	
	private def initWeapons() {
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/Weapons.csv"))).eachLine { map ->
			// using name and mass since Hatchets have the same name but differ in mass based on mech tonnage
			def weapon = Weapon.findByNameAndMass(map.name, map.mass)
			if(weapon) return
			
			// update Aliases to be multiple strings in an array instead of one string
			Weapon.updateAliases(map)
			
			// update the ammoTypes to be a map of the Ammo class by shortName
			def ammoTypesStr = map.ammoTypes
			if(ammoTypesStr != null) {
				
				def ammoTypesArr = []
				ammoTypesStr.split(":").each {
					Ammo.findAllByShortName(it).each { Ammo itAmmo ->
						ammoTypesArr.add(itAmmo)
					}
				}
				map.ammoTypes = ammoTypesArr
			}
			
			weapon = new Weapon(map)
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
