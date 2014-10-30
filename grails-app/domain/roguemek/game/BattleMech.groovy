package roguemek.game

import roguemek.model.*

/**
 * Represents the owned mech that can be taken into battle
 */
class BattleMech extends BattleUnit {

	Mech mech
	
	// Storing Mech's armor, internals, and crits which can take damage during battle
	Integer[] armor
	Integer[] internals
	
	List crits
	static hasMany = [crits: String]
	
    static constraints = {
		mech nullable: false
		
		armor size: 11..11
		internals size: 8..8
		
		crits size: 78..78
    }
	
	def beforeValidate() {

		if(mech != null 
				&& armor == null && internals == null && crits == null){
			// armor, internals, and crits needs to be initialized the first time from the Mech associated with it
			armor = mech.armor
			internals = mech.internals
			
			// initialize the displayed image
			image = BattleMech.initMechImage(mech)
			
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
					def newEquipMap = [ownerPilot: pilot, equipment: thisEquip, location: location]
					
					if(thisEquip instanceof Weapon) {
						bEquip = new BattleWeapon(newEquipMap)
					}
					else if(thisEquip instanceof Ammo) {
						bEquip = new BattleAmmo(newEquipMap)
					}
					else {
						bEquip = new BattleEquipment(newEquipMap)
					}
					
					bEquip.save flush:true
					
					if(thisEquip.crits > 1) {
						// this crit needs to continue to subsequent locations for the same item
						prevCritNum[equipId] = 1
						prevCritEquip[equipId] = bEquip.id
					}
					
					crits[counter++] = bEquip.id
					
					bEquip.discard()
				}
			}
		}
	}
	
	private static String imagesBasePath = "units/mechs/"
	private static String imagesTestPath = "grails-app/assets/images/units/mechs/"
	private static String imagesExtension = ".gif"
	
	/**
	 * Used during creation of the BattleMech to determine the image to be used
	 * @param mech
	 * @return
	 */
	private static String initMechImage(Mech mech) {
		String mechImage = "";
		if(mech == null) return mechImage;
		
		// If no specific image found, use a default based on the mech's weight class
		String weightClass = mech.getWeightClass()
		mechImage = "default_"+weightClass+".gif"
		
		// TODO: for now just matching by mech name (all lower case, no spaces), but should also extend to try chassis+variant first
		String testImage = mech.name.toLowerCase().replaceAll(" ", "") + imagesExtension
		File imageFile = new File(imagesTestPath + testImage)
		
		if(imageFile.exists()) {
			mechImage = testImage
		}
		
		return imagesBasePath + mechImage
	}
	
	public static int getCritSectionStart(int critSectionIndex) {
		return Mech.getCritSectionStart(critSectionIndex)
	}
	
	public static int getCritSectionEnd(int critSectionIndex) {
		return Mech.getCritSectionEnd(critSectionIndex)
	}
	
	public BattleEquipment getEquipmentAt(int critIndex) {
		def thisCritId = this.crits.getAt(critIndex)
		return (thisCritId != null) ? BattleEquipment.read(thisCritId) : null
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
		
		if(critSectionStart >= 0 && critSectionEnd < 78) {
			for(int i=critSectionStart; i<=critSectionEnd; i++) {
				critSection.add(this.getEquipmentAt(i))
			}
		}
		
		return critSection
	}
	
	@Override
	public String toString() {
		return mech?.name +" "+ mech?.chassis+"-"+mech?.variant
	}
}
