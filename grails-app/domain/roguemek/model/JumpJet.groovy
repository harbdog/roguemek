package roguemek.model

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class JumpJet extends Equipment {

    static constraints = { }

	static mapping = {
		// Model classes do not change values, versioning not needed
		version false
	}

    @Override
	public String toString() {
		return "<JumpJet:"+name+">"
	}
}
