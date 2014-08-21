package roguemek.game

import roguemek.model.Mech;

/**
 * Represents the owned mech that can be taken into battle
 */
class BattleMech extends BattleUnit {

	Mech mech
	
	// Storing Mech's armor, internals, and crits which can take damage during battle
	Integer[] armor
	Integer[] internals
	
	byte[] crits
	
    static constraints = {
		mech nullable: false
		
		armor size: 11..11
		internals size: 8..8
		
		// setting crits as bytes with maxSize 2048 since the arrays tend to get just under 1000 bytes
		// where by default H2 was creating as 255 bytes
		crits maxSize: 2048, size: 78..78
    }
	
	def beforeValidate() {

		if(mech != null 
				&& armor == null && internals == null && crits == null){
			// armor, internals, and crits needs to be initialized the first time from the Mech associated with it
			armor = mech.armor
			internals = mech.internals
			crits = mech.crits
		}
	}
	
	@Override
	public String toString() {
		return mech?.name +" "+ mech?.chassis+"-"+mech?.variant
	}
}
