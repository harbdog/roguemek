package roguemek

import org.codehaus.groovy.grails.web.servlet.mvc.GrailsParameterMap

import roguemek.model.Mech;

class MechCreateCommand {
	// Configuration properties
	String name
	String description
	String chassis
	String variant
	
	int tonnage
	
    static constraints = {
		importFrom Mech
    }
	
	Mech createMech(GrailsParameterMap params) {
		def armor = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		def internals = [0, 0, 0, 0, 0, 0, 0, 0]
		
		params.armor = armor
		params.internals = internals
		
		def mech = new Mech(params)
		
		return mech
	}
}
