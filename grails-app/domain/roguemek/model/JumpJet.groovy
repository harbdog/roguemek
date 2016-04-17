package roguemek.model

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class JumpJet extends Equipment {

    static constraints = { }

	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}

	static void init() {
		// Create all objects for the game from csv
		new CSVMapReader(new InputStreamReader(ContextHelper.getContextSource("csv/JumpJets.csv"))).eachLine { map ->
			// using name and mass since Jump Jets have the same name but differ in mass based on mech tonnage
			def jumpjet = JumpJet.findByNameAndMass(map.name, map.mass)
			if(jumpjet) return

			// update Aliases to be multiple strings in an array instead of one string
			JumpJet.updateAliases(map)

			jumpjet = new JumpJet(map)

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

    @Override
	public String toString() {
		return "<JumpJet:"+name+">"
	}
}
