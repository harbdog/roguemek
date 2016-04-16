package roguemek.model

import grails.util.Environment

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
