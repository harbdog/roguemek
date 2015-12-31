package roguemek.model

import grails.util.Environment

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

/**
 * Stores last names
 *
 * Sourced csv surnames file from MegaMek
 *
 */
class Surname {

	String surname
	
    static constraints = {
		surname blank: false
    }
	
	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}
	
	static void init() {
		def defaultName = Surname.findBySurname("Aaron")
		if(defaultName != null) {
			return
		}
		
		def isDevEnv = (Environment.current == Environment.DEVELOPMENT)
		def devLimitCounter = 0
		
		// Create all names from csv
		new InputStreamReader(ContextHelper.getContextSource("names/surnames.txt")).eachCsvLine { tokens ->
			
			if(isDevEnv) {
				// in development mode, save time by only loading a subset of names
				def devSkip = (devLimitCounter > 0)
				
				if(devLimitCounter < 100) devLimitCounter ++
				else devLimitCounter = 0
				
				if(devSkip) {
					return;
				}
			}
			
			def name = tokens[0]
			if(name == null || "".equals(name)) return;
			
			def sName = new Surname(surname: name)
			sName.save()
		}
	}
	
	public static Surname getRandom() {
		return Surname.executeQuery("from Surname order by random", [max: 1]).first()
	}
}
