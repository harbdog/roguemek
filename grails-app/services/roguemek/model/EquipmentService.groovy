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
		def generics = batchInsertEquipment(sql, "csv/Equipment.csv")

        // Create JumpJets from csv
        //JumpJet.init()
        def jumpJets = batchInsertEquipment(sql, "csv/JumpJets.csv")
        if(jumpJets.size() > 0) {
			// handle JumpJet table specific inserts
            sql.withBatch(20, "insert into jump_jet (id) "
                    + "values ((SELECT id FROM equipment WHERE name = :name AND short_name = :shortName AND mass = :mass))".toString()) { preparedStatement ->

                jumpJets.each { map ->
                    preparedStatement.addBatch(map)
                    log.info("Mapped as jumpjet: ${map.name} (${map.mass}T)")
                }
            }
        }

        // Create HeatSinks from csv
        //HeatSink.init()
		def heatSinks = batchInsertEquipment(sql, "csv/HeatSinks.csv")
        if(heatSinks.size() > 0) {
			// handle HeatSink table specific inserts
            sql.withBatch(20, "insert into heat_sink (id, dissipation) "
                    + "values ((SELECT id FROM equipment WHERE name = :name AND short_name = :shortName AND mass = :mass), "
					+ ":dissipation)".toString()) { preparedStatement ->

                heatSinks.each { map ->
                    preparedStatement.addBatch(map)
                    log.info("Mapped as heatsink: ${map.name}")
                }
            }
        }

        // Create Ammo from csv
        //Ammo.init()
		def ammo = batchInsertEquipment(sql, "csv/Ammo.csv")
        if(ammo.size() > 0) {
			// handle Ammo table specific inserts
            sql.withBatch(20, "insert into ammo (id, ammo_per_ton, explosive_damage) "
                    + "values ((SELECT id FROM equipment WHERE name = :name AND short_name = :shortName AND mass = :mass), "
					+ ":ammoPerTon, :explosiveDamage)".toString()) { preparedStatement ->

                ammo.each { map ->
                    preparedStatement.addBatch(map)
                    log.info("Mapped as ammo: ${map.name}")
                }
            }
        }

        // Create Weapons from csv
        //Weapon.init()
		def weapons = batchInsertEquipment(sql, "csv/Weapons.csv")
        if(weapons.size() > 0) {
			// ammo types per weapon is mapped to separate table
			def ammoTypeMaps = []

			// handle Weapon table specific inserts
            sql.withBatch(20, "insert into weapon (id, cluster_hits, cycle, damage, heat, long_range, medium_range, min_range, projectiles, short_range, weapon_type) "
                    + "values ((SELECT id FROM equipment WHERE name = :name AND short_name = :shortName AND mass = :mass), "
					+ ":clusterHits, :cycle, :damage, :heat, :longRange, :mediumRange, :minRange, :projectiles, :shortRange, :weaponType)".toString()) { preparedStatement ->

                weapons.each { map ->
                    preparedStatement.addBatch(map)
                    log.info("Mapped as weapon: ${map.name}")

					if(map.ammoTypes?.length() > 0) {
						map.ammoTypes = map.ammoTypes.split(":")
						ammoTypeMaps.add(map)
	                }
                }
            }

			if(ammoTypeMaps.size() > 0) {
				// update the ammoTypes to be a map of the Ammo class by shortName
				sql.withBatch(20, "insert into weapon_ammo (weapon_ammo_types_id, ammo_id) "
	                    + "values ((SELECT id FROM equipment WHERE name = :name AND short_name = :shortName AND mass = :mass), "
						+ ":ammoId)".toString()) { preparedStatement ->

	                ammoTypeMaps.each { map ->
						map.ammoTypes.each { ammoShortName ->
							Equipment.findAllByShortName(ammoShortName).each { Equipment itAmmo ->
								map.ammoId = itAmmo.id
								preparedStatement.addBatch(map)

								log.info("Mapped as ammo type: ${map.name} -> ${itAmmo}")
							}
						}
	                }
	            }
			}
        }

        sql.close()
	}

	/**
	 * Batch loads all base Equipment objects from the given csv file and returns
	 * a list of maps that were used to generate the records
	 */
	private def batchInsertEquipment(Sql sql, String equipmentCsvFile) {
		// store all data maps so they can be returned
		def equipMaps = []

		// equipment_aliases is a separate table that will need its own batch call after all equipment has loaded already
		def equipAliases = []

		// Create all Equipment for the game from csv
        // TODO: create common method for the base equipment batch insert
        sql.withBatch(20, "insert into equipment (name,short_name,description,mass,crits,tech,year,cbills,battle_value) "
                + "values (:name,:shortName,:description,:mass,:crits,:tech,:year,:cbills,:battleValue)".toString()) { preparedStatement ->

    		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource( equipmentCsvFile ))).eachLine { map ->
    			def equip = Equipment.findByName(map.name)
    			if(equip) return

    			preparedStatement.addBatch(map)
                log.info("Created equipment ${map.name}")

                // store aliases list for batch insert later
                if(map.aliases?.length() > 0) {
					map.aliases = map.aliases.split(",")
					equipAliases.add(map)
                }

				equipMaps.add(map)
    		}
        }

		if(equipAliases.size() > 0) {
            // link equipment aliases
            sql.withBatch(20, "insert into equipment_aliases (equipment_id, aliases_string) "
                    + "values (:equipId, :alias)".toString()) { preparedStatement ->

                equipAliases.each { map ->
					// keying by name, short name, and mass to make sure the right objects are mapped
                    def equipFound = Equipment.findAllByNameAndShortNameAndMass(map.name, map.shortName, map.mass)
                    if(!equipFound) {
                        log.error("No equipment found for aliases: ${map.aliases}")
                        return
                    }

                    equipFound.each { equip ->
                        map.aliases.each { alias ->
                            preparedStatement.addBatch(equipId:equip.id, alias:alias)
                        }
                        log.debug("Linked ${equip} aliases: ${map.aliases}")
                    }
                }
            }
        }

		return equipMaps
	}
}
