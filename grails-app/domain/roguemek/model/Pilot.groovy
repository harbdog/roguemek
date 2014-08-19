package roguemek.model

import roguemek.User

class Pilot {

	String firstName
	String lastName
	
	Character status
	
	static hasMany = [ownedMechs:Mech]
	static belongsTo = User
	
	// STATIC value mappings
	static Character STATUS_ACTIVE = 'A'
	static Character STATUS_DECEASED = 'D'
	static Character STATUS_RETIRED = 'R'
	
    static constraints = {
		firstName blank: false
		lastName blank: false
		
		status inList: [STATUS_ACTIVE, STATUS_DECEASED, STATUS_RETIRED]
    }
}
