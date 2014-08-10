package roguemek.model

class Equipment {
	static searchable = {
		only = ['name', 'description', 'shortName', 'aliases']
	}

    String name
	String shortName
	String aliases
	String description
	
	Character tech
	Faction faction
	Integer year
	
	Double mass
	Integer crits
	Long cbills
	Integer battleValue
	
	// STATIC value mappings
	static Character IS = 'I'
	static Character CLAN = 'C'
	
	static mapping = {
		// All extending classes will get their own tables
		tablePerHierarchy false
	}

    static constraints = {
		name blank: false
		shortName nullable: true
		aliases nullable: true
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
