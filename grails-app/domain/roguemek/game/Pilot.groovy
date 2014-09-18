package roguemek.game

import roguemek.User

class Pilot {

	String firstName
	String lastName
	User ownerUser
	Character status
	
	static hasMany = [ownedUnits:BattleUnit]
	
	// STATIC value mappings
	static Character STATUS_ACTIVE = 'A'
	static Character STATUS_DECEASED = 'D'
	static Character STATUS_RETIRED = 'R'
	
    static constraints = {
		firstName blank: false
		lastName blank: false
		ownerUser nullable: false
		
		status inList: [STATUS_ACTIVE, STATUS_DECEASED, STATUS_RETIRED]
    }
	
	@Override
	public String toString() {
		return firstName + " \""+ownerUser.toString()+"\" " + lastName
	}
}
