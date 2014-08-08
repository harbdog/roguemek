package roguemek

class Equipment {

    String name
	String description
	
	Character tech
	Faction faction
	Integer year
	
	Double mass
	Integer crits
	Long cbills
	Integer battleValue
	
	// STATIC value mappings
	static IS = 'I'
	static CLAN = 'C'
	
	static mapping = {
		tablePerHierarchy false
	}

    static constraints = {
		name blank: false
		description nullable: true
		
		tech inList: [IS, CLAN]
		faction nullable: true
		year range: 2014..3132
		
		mass min: 0.0D
		crits min: 1
		cbills min: 0L
		battleValue min: 0
    }
}
