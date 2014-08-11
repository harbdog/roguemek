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
	static Character IS = 'I'
	static Character CLAN = 'C'
	
	static mapping = {
		// All extending classes will get their own tables
		tablePerHierarchy false
	}

    static constraints = {
		name blank: false
		shortName nullable: true
		description nullable: true
		
		tech inList: [IS, CLAN]
		faction nullable: true
		year range: 2014..3132
		
		mass min: 0.0D
		crits min: 1
		cbills min: 0L
		battleValue min: 0
    }
	
	static void initEquipment() {
		def defaultEquip = Equipment.findByName("Cockpit")
		if(defaultEquip != null) {
			return
		}
		
		// Create all objects for the game from csv
		new CSVMapReader(new FileReader("src/csv/Equipment.csv")).eachLine { map ->
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
}
