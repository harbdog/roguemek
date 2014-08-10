package roguemek.model

import org.grails.plugins.csv.CSVMapReader

class HeatSink extends Equipment {
	
	Double dissipation

    static constraints = {
		dissipation min: 0.0D
    }
	
	static void initHeatSinks() {
		def defaultHS = HeatSink.findByName("Heat Sink")
		if(defaultHS != null) {
			return
		}
		
		// Create all objects for the game from csv
		new CSVMapReader(new FileReader("src/csv/HeatSinks.csv")).eachLine { map ->
			def heatsink = new HeatSink(map)
			
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
