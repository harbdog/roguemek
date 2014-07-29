package roguemek

class MechCreateCommand {
	// Configuration properties
	String name
	String description
	String chassis
	String variant
	
	int tonnage
	
    static constraints = {
		name blank: false
		description blank: true
		chassis blank: false
		variant blank: false
		
		tonnage range : 20..100, validator:{val, obj ->
			if(val % 5 != 0) {
				return false;
			}
		}
    }
	
	Mech createMech() {
		def armor = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		def internals = [0, 0, 0, 0, 0, 0, 0, 0]
		
		def mech = new Mech(name: name, description: description, chassis: chassis, variant: variant, tonnage: tonnage, armor: armor, internals: internals)
		
		return mech
	}
}
