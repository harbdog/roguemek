package roguemek.model

import org.grails.plugins.csv.CSVMapReader

class Faction {
	
	String name
	String description

    static constraints = {
		name blank: false
		description nullable: true
    }
	
	static void initFactions() {
		def defaultFaction = Faction.findByName("Lone Wolf")
		if(defaultFaction != null) {
			return
		}
		
		// Create all factions for the game from csv
		new CSVMapReader(new FileReader("src/csv/Factions.csv")).eachLine { map ->
			def faction = new Faction(map)
			faction.save()
			
			log.info("Created faction "+faction.name)
		}
		
	}
}
