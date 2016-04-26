package roguemek.model

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class Faction {
	
	String name
	String description

    static constraints = {
		name blank: false
		description nullable: true
    }
	
	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}
	
	static void init() {
		// Create all factions for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/Factions.csv"))).eachLine { map ->
			def faction = Faction.findByName(map.name)
			if(faction) return
			
			faction = new Faction(map)
			
			if(!faction.validate()) {
				log.error("Errors with faction "+faction.name+":\n")
				faction.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				faction.save()
				log.debug("Created faction "+faction.name)
			}
		}
		
	}
}
