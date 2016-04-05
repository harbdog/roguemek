package roguemek.game

import grails.transaction.Transactional
import roguemek.model.*
import roguemek.assets.ContextHelper
import roguemek.cache.UnitSummaryCache

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

@Transactional
class UnitService {
	private static Log log = LogFactory.getLog(this)
	
	public static String imagesExtension = "gif"
	
	private static String imagesBasePath = "units/mechs/"
	
	def mechService
	
    /**
	 * Used to determine the image to be used for the unit
	 * @param mech
	 * @return
	 */
	@Transactional(readOnly = true)
	public String getUnitImagePath(Unit unit) {
		String mechImage = "";
		
		if(unit instanceof Mech) {
			Mech mech = unit
			
			// If no specific image found, use a default based on the mech's weight class
			String weightClass = mech.getWeightClass()
			mechImage = "default_"+ weightClass +"."+imagesExtension
			
			// using all lowercase and no spaces for base mech name
			String mechName = mech.name.toLowerCase().replaceAll(" ", "")
			String variant = mech.variant.toLowerCase()
			
			def imageNameList = [
				"${mechName}_${variant}",		// match by "name_variant.gif"
				"${mechName}"					// match by "name.gif"
			]
			
			for(String imageName in imageNameList) {
				try{
					String testImage = imageName + "."+imagesExtension
					InputStream imageFile = ContextHelper.getContextAsset("images/"+imagesBasePath + testImage)
				
					log.trace("testImage:"+testImage+", available="+imageFile.available())
					if(imageFile.available()) {
						mechImage = testImage
						break;
					}
				} catch(Exception e) {
					// this image not found, move on to the next
				}
			}
		}
		
		return imagesBasePath + mechImage
	}
	
	/**
	 * Gets all weapons currently equipped on the BattleUnit
	 * @return Array of BattleWeapon objects
	 */
	@Transactional(readOnly = true)
	public def getWeapons(BattleUnit battleUnit) {
		def weapons = []
		
		if(battleUnit instanceof BattleMech) {
			// improved performance by making this method only perform a single query for all weapon objects
			
			// add normal weapons
			def critIds = battleUnit.crits.unique(false)
			
			// add physical weapons
			def physicalIds = battleUnit.physical.unique(false)
			critIds.addAll(physicalIds)
			
			def weaponCriteria = BattleWeapon.createCriteria()
			def weaponList = weaponCriteria.list {
				'in'("id", critIds)
			}
			
			weaponList.each { BattleWeapon weaponObj ->
				weapons.add(weaponObj)
			}
		}
		
		return weapons
	}
	
	
	/**
	 * Gets only the BattleEquipment objects which match the base equipment object
	 * @param equip
	 * @return
	 */
	public BattleEquipment[] getEquipmentFromBaseObject(BattleUnit battleUnit, Equipment equip) {
		def foundEquipment = []
		
		def battleEquipIds
		if(battleUnit instanceof BattleMech) {
			battleEquipIds = battleUnit.crits.unique(false)
		}
		
		if(battleEquipIds?.size() > 0) {
			// improved performance by making this method only perform a single query for all crit objects
			def equipCriteria = BattleEquipment.createCriteria()
			def equipList = equipCriteria.list {
				and {
					eq("equipment", equip)
					'in'("id", battleEquipIds)
				}
			}
			
			equipList.each { BattleEquipment thisEquip ->
				foundEquipment.add(thisEquip)
			}
		}
		
		return foundEquipment
	}
	
	/**
	 * Gets only the BattleEquipment objects which match the base equipment object
	 * @param equip
	 * @return
	 */
	public BattleEquipment[] getEquipmentFromMTFNames(BattleUnit battleUnit, List MTF_NAMES) {
		def foundEquipment = []
		if(MTF_NAMES == null || MTF_NAMES.size() == 0) return foundEquipment
		
		def battleEquipIds
		if(battleUnit instanceof BattleMech) {
			battleEquipIds = battleUnit.crits.unique(false)
		}
		
		if(battleEquipIds?.size() > 0) {
			// improved performance by making this method only perform a single query for all crit objects
			def equipCriteria = BattleEquipment.createCriteria()
			def equipList = equipCriteria.list {
				createAlias("equipment", "equip", org.hibernate.sql.JoinType.LEFT_OUTER_JOIN)
				and {
					'in'("equip.name", MTF_NAMES)
					'in'("id", battleEquipIds)
				}
			}
			
			equipList.each { BattleEquipment thisEquip ->
				foundEquipment.add(thisEquip)
			}
		}
		
		return foundEquipment
	}
	
	/**
	 * Generates Map of summary data for a given Unit, pulling from cache if it has already been generated
	 * @param unit
	 * @return
	 */
	public def getUnitSummaryData(Unit unit) {
		if(unit == null) return [:]
		
		def unitSummary = UnitSummaryCache.findByUnitId(unit.id)
		if(unitSummary) {
			log.trace "UnitSummaryData for ${unit.name}(${unit.id}): using from cache"
			return unitSummary.getCache()
		}
		
		def unitSummaryData = [:]
		
		if(unit instanceof Mech) {
			// AP calculated as runMP dividided by 2 (rounded up) plus 1
			int runMP = Math.ceil(unit.walkMP * 1.5)
			int unitAP = Math.floor(runMP / 2) + (runMP % 2) + 1
			unitSummaryData.unitAP = unitAP
			
			// JP calculated as jumpMP divided by 2 (rounded up)
			int unitJP = (unit.jumpMP > 0) ? Math.floor(unit.jumpMP / 2) + (unit.jumpMP % 2) : 0
			unitSummaryData.unitJP = unitJP
			
			// count up all the armor
			int totalArmor = 0
			unit.armor?.each {
				totalArmor += it
			}
			unitSummaryData.totalArmor = totalArmor
			
			// find and map out heat sinks, weapons, and other important equipment from criticals
			def unitCritsBySection = mechService.getAllCritSections(unit)
			
			def heatsinks = [:] // [[<heatsink>:<critCount>], ...]
			def weapons = [:]	// [[<weapon>:<critCount>], ...]
			
			def ammos = [:]		// [[<ammo>:<critCount>], ...]
			def weaponAmmo = [:]// [[<weapon>:<ammoCount>], ...]
			
			for(def critSectionIndex in Mech.CRIT_LOCATIONS) {
				def critEquipment = unitCritsBySection[critSectionIndex]
				if(critEquipment == null) continue
				
				for(def thisEquip in critEquipment) {
					def map
					if(thisEquip instanceof Weapon) {
						map = weapons
					} else if(thisEquip instanceof HeatSink) {
						map = heatsinks
					}
					else if(thisEquip instanceof Ammo) {
						map = ammos
					}
					
					if(map != null) {
						if(map[thisEquip] == null) {
							map[thisEquip] = 1
						}
						else {
							map[thisEquip] += 1
						}
					}
				}
			}
			
			// adjust equipment for crit slots used per item
			int numHeatSinks = mechService.getEngineHeatSinks(unit)
			heatsinks.each { HeatSink heatsink, int critCount ->
				numHeatSinks += (critCount / heatsink.crits)
			}
			unitSummaryData.numHeatSinks = numHeatSinks
			
			weapons.each { Weapon weapon, int critCount ->
				weapons[weapon] = (critCount / weapon.crits)
				
				// calculate amount of ammo for weapons
				if(weapon.ammoTypes) {
					weapon.ammoTypes.each { Ammo at ->
						if(weaponAmmo[weapon] == null) {
							weaponAmmo[weapon] = 0
						}
						
						def ammoCount = ammos[at]
						if(ammoCount != null) {
							weaponAmmo[weapon] += (ammoCount * at.ammoPerTon)
						}
					}
				}
			}
			// each map and list key or value needs to be stored as string references only, no objects, since they will be JSON'ified in cache
			unitSummaryData.weapons = weapons.collectEntries { weapon, weaponCount -> [(weapon.name): weaponCount] }
			unitSummaryData.weaponAmmo = weaponAmmo.collectEntries { weapon, ammoCount -> [(weapon.name): ammoCount] }
			
			def sortedWeapons = weapons.sort( { k1, k2 -> k1.name <=> k2.name } as Comparator )*.key
			unitSummaryData.sortedWeapons = sortedWeapons.collect { weapon -> weapon.name }
		}
		
		if(unitSummaryData.size() > 0) {
			UnitSummaryCache thisCache = new UnitSummaryCache(unitId: unit.id, cache: unitSummaryData)
			def cacheResult = thisCache.save flush:true
			if(!cacheResult) {
				log.debug thisCache.errors
				log.debug "UnitSummaryData for ${unit.name}(${unit.id}): could not save, retrying from cache"
				// maybe another user cached at the same time and won, return that then
				unitSummary = UnitSummaryCache.findByUnitId(unit.id)
				if(unitSummary) return unitSummary.getCache()
			}
			else {
				log.trace "UnitSummaryData for ${unit.name}(${unit.id}): ${thisCache.id}=${unitSummaryData}"
			}
		}
		
		return unitSummaryData
	}
}
