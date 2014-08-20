package roguemek.model

/**
 * Represents the owned mech that can be taken into battle
 */
class BattleMech {

	Mech mech
	Pilot ownerPilot
	
    static constraints = {
		mech nullable: false
		ownerPilot nullable: false
    }
}
