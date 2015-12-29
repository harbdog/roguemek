package roguemek.game

import roguemek.MekUser

class Pilot {
	private static final Date NULL_DATE = new Date(0)
	
	String id
	static mapping= {
		id generator: 'uuid'
	}
	
	MekUser ownerUser

	String firstName
	String lastName
	String callsign
	
	Character status
	
	static hasMany = [ownedUnits:BattleUnit]
	
	Date lastUpdate = NULL_DATE
	
	// STATIC value mappings
	static Character STATUS_ACTIVE = 'A'
	static Character STATUS_DECEASED = 'D'
	static Character STATUS_RETIRED = 'R'
	
    static constraints = {
		ownerUser nullable: false
		
		firstName blank: false
		lastName blank: false
		callsign nullable: true
		
		status inList: [STATUS_ACTIVE, STATUS_DECEASED, STATUS_RETIRED]
    }
	
	@Override
	public String toString() {
		if(callsign != null) {
			firstName + " \""+callsign+"\" " + lastName
		}
		return firstName + " " + lastName
	}
}
