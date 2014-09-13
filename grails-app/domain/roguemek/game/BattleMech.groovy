package roguemek.game

import roguemek.model.Equipment
import roguemek.model.Mech;

/**
 * Represents the owned mech that can be taken into battle
 */
class BattleMech extends BattleUnit {

	Mech mech
	
	// Storing Mech's armor, internals, and crits which can take damage during battle
	Integer[] armor
	Integer[] internals
	
	List crits
	static hasMany = [crits: long]
	
	// static location indices
	public static final HEAD = Mech.HEAD;
	public static final LEFT_ARM = Mech.LEFT_ARM;
	public static final LEFT_TORSO = Mech.LEFT_TORSO;
	public static final CENTER_TORSO = Mech.CENTER_TORSO;
	public static final RIGHT_TORSO = Mech.RIGHT_TORSO;
	public static final RIGHT_ARM = Mech.RIGHT_ARM;
	public static final LEFT_LEG = Mech.LEFT_LEG;
	public static final RIGHT_LEG = Mech.RIGHT_LEG;
	public static final LEFT_REAR = Mech.LEFT_REAR;
	public static final CENTER_REAR = Mech.CENTER_REAR;
	public static final RIGHT_REAR = Mech.RIGHT_REAR;
	
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
			
			// convert Equipment to BattleEquipment to store in crits
			def counter = 0
			crits = new long[78]
			mech.crits.each { equipId ->
				def thisEquip = Equipment.get(equipId)
				
				BattleEquipment bEquip = new BattleEquipment(ownerPilot: ownerPilot, equipment: Equipment.get(equipId))
				bEquip.save flush:true
				
				crits[counter++] = bEquip.id
			}
		}
	}
	
	public void testDamage(int damage){
		log.info "before damage: "+armor[CENTER_TORSO]
		
		armor[CENTER_TORSO] = armor[CENTER_TORSO] - damage
		
		log.info "after damage: "+armor[CENTER_TORSO]
		
		save flush:true
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
