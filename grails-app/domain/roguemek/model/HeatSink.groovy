package roguemek.model

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class HeatSink extends Equipment {
	
	Double dissipation

    static constraints = {
		dissipation min: 0.0D
    }
	
	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}
	
	static void init() {
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/HeatSinks.csv"))).eachLine { map ->
			def heatsink = HeatSink.findByName(map.name)
			if(heatsink) return
			
			// update Aliases to be multiple strings in an array instead of one string
			HeatSink.updateAliases(map)
			
			heatsink = new HeatSink(map)
			
			if(!heatsink.validate()) {
				log.error("Errors with heatsink "+heatsink.name+":\n")
				heatsink.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				heatsink.save()
				log.info("Created heatsink "+heatsink.name)
			}
		}
	}
}
