package roguemek

class Weapon {
	
	String name
	String description
	
	Integer damage
	Integer heat
	Integer tonnage
	Integer crits

    static constraints = {
		name blank: false
		description blank: true
		
		damage min: 0
		heat min: 0
		tonnage min: 1
		crits min: 1
    }
}
