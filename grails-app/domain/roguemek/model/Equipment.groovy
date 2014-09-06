package roguemek.model

import org.grails.plugins.csv.CSVMapReader

class Equipment {
	static searchable = {
		only = ['name', 'description', 'shortName']
	}

    String name
	String shortName
	static hasMany = [aliases:String]
	String description
	
	Character tech
	Faction faction
	Integer year
	
	Double mass
	Integer crits
	Long cbills
	Integer battleValue
	
	// STATIC value mappings
	public static final Character TECH_IS = 'I'
	public static final Character TECH_CLAN = 'C'
	
	static mapping = {
		// All extending classes will get their own tables
		tablePerHierarchy false
	}

    static constraints = {
		name blank: false
		shortName nullable: true
		description nullable: true
		
		tech inList: [TECH_IS, TECH_CLAN]
		faction nullable: true
		year range: 0..3132
		
		mass min: 0.0D
		crits min: 1
		cbills min: 0L
		battleValue min: 0
    }
	
	static void init() {
		def defaultEquip = Equipment.findByName("Cockpit")
		if(defaultEquip != null) {
			return
		}
		
		// Create all objects for the game from csv
		new CSVMapReader(new FileReader("src/csv/Equipment.csv")).eachLine { map ->
			
			// update Aliases to be multiple strings in an array instead of one string
			Equipment.updateAliases(map)
			
			def equip = new Equipment(map)
			
			if(!equip.validate()) {
				log.error("Errors with equipment "+equip.name+":\n")
				equip.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				equip.save()
				log.info("Created equipment "+equip.name)
			}
		}
	}
	
	/**
	 * Method used for converting the input aliases comma separated string into an array
	 * @param map
	 */
	private static void updateAliases(LinkedHashMap map) {
		String aliases = map.aliases
		if(aliases.contains(",")) {
			map.aliases = []
			aliases.split(",").each{
				map.aliases.add(it)
			}
		}
	}
	
	@Override
	public String toString() {
		return "<Equipment:"+name+">"
	}
}
