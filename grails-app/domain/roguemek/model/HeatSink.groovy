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

	@Override
	public String toString() {
		return "<HeatSink:"+name+">"
	}
}
