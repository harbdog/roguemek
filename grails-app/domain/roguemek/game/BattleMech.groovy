package roguemek.game

import roguemek.model.*
import roguemek.game.UnitService

/**
 * Represents the owned mech that can be taken into battle
 */
class BattleMech extends BattleUnit {

	Mech mech
	
	// Storing Mech's armor, internals, and crits which can take damage during battle
	Integer[] armor
	Integer[] internals
	
	List crits
	
	// Storing physical attacks as their own weapon objects
	List physical
	
	static hasMany = [crits: String, physical: String]
	
    static constraints = {
		mech nullable: false
		
		armor size: 11..11
		internals size: 8..8
		
		crits size: Mech.NUM_CRITS..Mech.NUM_CRITS
		physical size: 3..4		// Punch, Kick, and Charge, then DFA only if it has jump jets
    }
	
	def unitService
	
	def beforeValidate() {

		if(mech != null 
				&& armor == null && internals == null && crits == null){
			// armor, internals, and crits needs to be initialized the first time from the Mech associated with it
			armor = mech.armor
			internals = mech.internals
			
			// determine the displayed image
			imageFile = unitService.getUnitImagePath(mech)
			
			// generate the displayed image with default color/camo
			image = BattleUnit.initUnitImage(this)
			
			// convert Equipment to BattleEquipment to store in crits
			def counter = 0
			crits = new String[78]
			
			// keep track of equipment with >1 crit slots so they can point to the same id
			def prevCritEquip = ["-1": null]
			def prevCritNum = ["-1": 0]
			
			mech.crits.each { equipId ->
				Equipment thisEquip = Equipment.read(equipId)
				int location = Mech.getCritSectionIndexOf(counter)
				
				int prevNum = prevCritNum[equipId] ?: 0
				String prevEquipId = prevCritEquip[equipId]
				
				if(prevNum > 0 && prevEquipId != null &&
						thisEquip.crits > 1 && thisEquip.crits > prevNum) {
					// this crit is a continuation of the same equipment before it
					prevCritNum[equipId] = prevNum + 1
					
					BattleEquipment prevEquip = BattleEquipment.read(prevEquipId)
					
					if(prevEquip.location != location &&
							(location == Mech.CENTER_TORSO || location == Mech.LEFT_ARM || location == Mech.RIGHT_ARM)) {
						// This equipment is spread across multiple crit sections, choose the ideal section
						// (e.g. CT for Engine, LA/RA for split crit weapons like AC/20 or ArrowIV)
						prevEquip = BattleEquipment.get(prevEquipId)
						prevEquip.location = location
						prevEquip.save flush:true
					}
					
					crits[counter++] = prevEquipId
				}
				else {
					BattleEquipment bEquip
					def newEquipMap = [ownerUser: null, equipment: thisEquip, location: location]
					
					if(thisEquip.isEmpty()) {
						// if the equipment is just "-Empty-", reuse the same BattleEquipment object across all BattleUnits for it
						bEquip = BattleEquipment.getEmpty()
						if(bEquip == null) {
							bEquip = new BattleEquipment(newEquipMap)
							bEquip.save flush:true
						}
					}
					else if(thisEquip instanceof Weapon) {
						bEquip = new BattleWeapon(newEquipMap)
						
						if(bEquip.isHatchet()) {
							bEquip.actualDamage = Math.ceil(mech.mass / 5)
						}
						
						bEquip.save flush:true
					}
					else if(thisEquip instanceof Ammo) {
						bEquip = new BattleAmmo(newEquipMap)
						bEquip.save flush:true
					}
					else {
						bEquip = new BattleEquipment(newEquipMap)
						bEquip.save flush:true
					}
					
					if(thisEquip.crits > 1) {
						// this crit needs to continue to subsequent locations for the same item
						prevCritNum[equipId] = 1
						prevCritEquip[equipId] = bEquip.id
					}
					
					crits[counter++] = bEquip.id
					
					bEquip.discard()
				}
			}
			
			// Determine physical weapons and their specific base damage for the mech
			def hasJumpMP = (mech.jumpMP > 0)
			def physicalWeapons = []
			
			BattleWeapon punch = new BattleWeapon(ownerUser: null, equipment: Equipment.findByName("Punch"), location: null)
			punch.actualDamage = Math.ceil(mech.mass / 10)
			punch.save flush:true
			physicalWeapons.add(punch)
			
			BattleWeapon kick = new BattleWeapon(ownerUser: null, equipment: Equipment.findByName("Kick"), location: null)
			kick.actualDamage = Math.ceil(mech.mass / 5)
			kick.save flush:true
			physicalWeapons.add(kick)
			
			BattleWeapon charge = new BattleWeapon(ownerUser: null, equipment: Equipment.findByName("Charge"), location: null)
			charge.actualDamage = Math.ceil(mech.mass / 10)
			charge.save flush:true
			physicalWeapons.add(charge)
			
			if(hasJumpMP) {
				BattleWeapon dfa = new BattleWeapon(ownerUser: null, equipment: Equipment.findByName("Death From Above"), location: null)
				dfa.actualDamage = Math.ceil(3 * mech.mass / 10)
				dfa.save flush:true
				physicalWeapons.add(dfa)
			}
			
			physical = new String[physicalWeapons.size()]
			def i = 0
			for(BattleWeapon p in physicalWeapons) {
				physical[i++] = p.id
				p.discard()
			}
		}
	}
	
	/**
	 * Gets the start index of the crits array for the given section
	 * @param critSectionIndex
	 * @return
	 */
	public static int getCritSectionStart(int critSectionIndex) {
		return Mech.getCritSectionStart(critSectionIndex)
	}
	
	/**
	 * Gets the end index of the crits array for the given section
	 * @param critSectionIndex
	 * @return
	 */
	public static int getCritSectionEnd(int critSectionIndex) {
		return Mech.getCritSectionEnd(critSectionIndex)
	}
	
	/**
	 * Deletes all crit equipment that are not owned
	 */
	public void cleanEquipment() {
		if(crits == null) return
		
		def cleanedIds = []
		
		crits?.each { String equipId ->
			// only delete equipment if it is not considered owned
			if(cleanedIds.contains(equipId)) return
			
			BattleEquipment bEquip = BattleEquipment.get(equipId)
			if(bEquip != null && bEquip.ownerUser == null && !bEquip.isEmpty()) {
				bEquip.delete flush:true
				
				cleanedIds << equipId
			}
		}
		
		physical?.each { String equipId ->
			// all physical attack "equipment" needs to be deleted
			BattleEquipment bEquip = BattleEquipment.get(equipId)
			if(bEquip != null) {
				bEquip.delete flush:true
				
				cleanedIds << equipId
			}
		}
		
		crits = null
		save flush:true
	}
	
	/**
	 * Gets the BattleEquipment item at the given equipment index
	 * @param critIndex
	 * @return
	 */
	public BattleEquipment getEquipmentAt(int critIndex) {
		def thisCritId = this.crits.getAt(critIndex)
		return (thisCritId != null) ? BattleEquipment.read(thisCritId) : null
	}
	
	/**
	 * Gets only the BattleEquipment objects which match the base equipment object
	 * @param equip
	 * @return
	 */
	public BattleEquipment[] getEquipmentFromBaseObject(Equipment equip) {
		def foundEquipment = []
		
		for(String equipId in crits) {
			BattleEquipment thisEquip = BattleEquipment.get(equipId)
			if(thisEquip == null) {
				continue
			}
			
			if(thisEquip.equipment.id == equip.id) {
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
	public BattleEquipment[] getEquipmentFromMTFNames(List MTF_NAMES) {
		def foundEquipment = []
		
		for(String equipId in crits) {
			BattleEquipment thisEquip = BattleEquipment.get(equipId)
			if(thisEquip == null) {
				continue
			}
			
			if(MTF_NAMES.contains(thisEquip.getName())) {
				foundEquipment.add(thisEquip)
			}
		}
		
		return foundEquipment
	}
	
	/**
	 * Gets the Critical section index of the given equipment index
	 * @param critIndex
	 * @return
	 */
	public static int getCritSectionIndexOf(int critIndex) {
		return Mech.getCritSectionIndexOf(critIndex)
	}
	
	/**
	 * Gets the BattleEquipment array representing the crits array of just the given section
	 * @param critSectionIndex
	 * @return
	 */
	public BattleEquipment[] getCritSection(int critSectionIndex) {
		int critSectionStart = BattleMech.getCritSectionStart(critSectionIndex)
		int critSectionEnd = BattleMech.getCritSectionEnd(critSectionIndex)
		
		def critSection = []
		for(int i=critSectionStart; i<=critSectionEnd; i++) {
			critSection.add(this.getEquipmentAt(i))
		}
		
		return critSection
	}
	
	/**
	 * Gets all BattleEquipment arrays keyed by the section index
	 * @return Array of arrays with BattleEquipment objects
	 */
	public def getAllCritSections() {
		def allCritSections = []
		
		for(int critSectionIndex in Mech.CRIT_LOCATIONS) {
			allCritSections[critSectionIndex] = this.getCritSection(critSectionIndex)
		}
		
		return allCritSections
	}
	
	/**
	 * Determines if all internal armor on one of the legs is gone
	 * @return true if all internal armor on a leg is gone
	 */
	public boolean isLegged() {
		for(int legIndex in Mech.LEGS) {
			if(internals[legIndex] == 0) {
				return true
			}
		}
		
		return false
	}
	
	/**
	 * Gets all weapons currently equipped
	 * @return Array of BattleWeapon objects
	 */
	@Override
	public def getWeapons() {
		def weapons = []
		
		for(String equipId in physical) {
			if(equipId == null) continue
			BattleEquipment e = BattleEquipment.read(equipId)
			if(e instanceof BattleWeapon && !weapons.contains(e)) {
				weapons.add(e)
			}
		}
		
		for(String equipId in crits) {
			if(equipId == null) continue
			BattleEquipment e = BattleEquipment.read(equipId)
			if(e instanceof BattleWeapon && !weapons.contains(e)) {
				weapons.add(e)
			}
		}
		
		return weapons
	}
	
	/**
	 * Gets the average calculated health percentage of the unit based on its remaining armor/internals
	 * @return Double value of overall health percentage
	 */
	@Override
	public double getHealthPercentage() {
		def percentage = 0
		
		if(mech != null && !this.isDestroyed()) {
			def initialArmor = 0
			def initialInternal = 0
			
			def currentArmor = 0
			def currentInternal = 0
			
			for(def section in Mech.ALL_LOCATIONS) {
				
				initialArmor += mech.armor[section]
				currentArmor += armor[section]
				
				if(section < internals.size()) {
					initialInternal += mech.internals[section]
					currentInternal += internals[section]
				}
			}
			
			percentage = ((currentArmor + currentInternal) / (initialArmor + initialInternal)) * 100
		}
		
		return percentage
	}
	
	@Override
	public String toString() {
		return mech?.name +" "+ mech?.chassis+"-"+mech?.variant
	}
}
