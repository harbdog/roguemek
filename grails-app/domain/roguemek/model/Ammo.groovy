package roguemek.model

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class Ammo extends Equipment {

	Integer ammoPerTon
	Integer explosiveDamage

	static belongsTo = Weapon

    static constraints = {
		ammoPerTon min: 1
		explosiveDamage nullable: false, min: 0
    }

	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}

	@Override
	public String toString() {
		return "<Ammo:"+name+">"
	}
}
