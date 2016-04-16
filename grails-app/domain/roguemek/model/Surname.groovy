package roguemek.model

import grails.util.Environment

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
	
	public static Surname getRandom() {
		return Surname.executeQuery("from Surname order by random", [max: 1]).first()
	}
}
