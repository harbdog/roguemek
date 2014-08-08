package roguemek.model

class Faction {
	
	String name
	String description

    static constraints = {
		name blank: false
		description nullable: true
    }
}
