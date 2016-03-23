package roguemek.game

import grails.transaction.Transactional
import roguemek.model.*
import roguemek.assets.ContextHelper

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

@Transactional
class UnitService {
	private static Log log = LogFactory.getLog(this)
	
	public static String imagesExtension = "gif"
	
	private static String imagesBasePath = "units/mechs/"
	
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
				
					log.debug("testImage:"+testImage+", available="+imageFile.available())
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
}
