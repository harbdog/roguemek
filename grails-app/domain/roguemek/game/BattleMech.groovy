package roguemek.game

import roguemek.model.Mech;

/**
 * Represents the owned mech that can be taken into battle
 */
class BattleMech extends BattleUnit {

	Mech mech
	
    static constraints = {
		mech nullable: false
    }
	
	@Override
	public String toString() {
		return mech.name +" "+ mech.chassis+"-"+mech.variant
	}
}
