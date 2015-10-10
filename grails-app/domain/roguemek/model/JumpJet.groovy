package roguemek.model

import java.io.File

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class JumpJet extends Equipment {

    static constraints = { }
	
	static void init() {
		def defaultJJ = JumpJet.findByName("Jump Jet")
		if(defaultJJ != null) {
			return
		}
		
		// Create all objects for the game from csv
		new CSVMapReader(new FileReader(new File(ContextHelper.getContextSourceDir(), "csv/JumpJets.csv"))).eachLine { map ->
			
			// update Aliases to be multiple strings in an array instead of one string
			JumpJet.updateAliases(map)
			
			def jumpjet = new JumpJet(map)
			
			if(!jumpjet.validate()) {
				log.error("Errors with jumpjet "+jumpjet.name+":\n")
				jumpjet.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				jumpjet.save()
				log.info("Created jumpjet "+jumpjet.name)
			}
		}
	}
}
