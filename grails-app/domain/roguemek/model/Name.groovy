package roguemek.model

import grails.util.Environment

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper
import roguemek.game.Roll

/**
 * Stores first names
 * 
 * Sourced csv firstnames files from MegaMek
 *
 */
class Name {

	String name
	Character gender
	
	public static final Character GENDER_FEMALE = "F"
	public static final Character GENDER_MALE = "M"
	
    static constraints = {
		name blank: false
		gender inList: [GENDER_FEMALE, GENDER_MALE]
    }
	
	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}
	
	static void init() {
		def defaultName = Name.findByName("Aaron")
		if(defaultName != null) {
			return
		}
		
		def isDevEnv = (Environment.current == Environment.DEVELOPMENT)
		def devLimitCounter = 0
		
		// Create all names from csv
		new InputStreamReader(ContextHelper.getContextSource("names/firstnames_female.txt")).eachCsvLine { tokens ->
			
			if(isDevEnv) {
				// in development mode, save time by only loading a subset of names
				def devSkip = (devLimitCounter > 0)
				
				if(devLimitCounter < 100) devLimitCounter ++
				else devLimitCounter = 0
				
				if(devSkip) {
					return
				}
			}
			
			def name = tokens[0]
			if(name == null || "".equals(name)) return;
			
			def fName = new Name(name: name, gender: GENDER_FEMALE)
			fName.save()
		}
		
		new InputStreamReader(ContextHelper.getContextSource("names/firstnames_male.txt")).eachCsvLine { tokens ->
			
			if(isDevEnv) {
				def devSkip = (devLimitCounter > 0)
				
				if(devLimitCounter < 100) devLimitCounter ++
				else devLimitCounter = 0
				
				if(devSkip) {
					return
				}
			}
			
			def name = tokens[0]
			if(name == null || "".equals(name)) return;
			
			def mName = new Name(name: name, gender: GENDER_MALE)
			mName.save()
		}
	}
	
	public static Name getRandom() {
		Character randomGender = GENDER_FEMALE
		if(Roll.randomInt(100, 1) > 50) {
			randomGender = GENDER_MALE
		}
		
		return getRandom(randomGender)
	}
	
	public static Name getRandom(Character gender) {
		return Name.executeQuery("from Name where gender='$gender' order by random", [max: 1]).first()
	}
}
