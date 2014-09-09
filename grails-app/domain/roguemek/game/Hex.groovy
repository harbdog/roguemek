package roguemek.game

import org.grails.plugins.csv.CSVMapReader
import roguemek.model.Terrain

class Hex {
	
	Integer x
	Integer y
	Integer elevation
	String theme
	
	static hasMany = [terrains:Terrain]
	
    static constraints = {
		x min: -1
		y min: -1
		elevation nullable: false
		theme nullable: true
    }
	
	/**
	 * Sourced from MegaMek Hex.java
	 * @param coords
	 * @param elevation
	 * @param terrain
	 * @return
	 */
	public static Hex createHex(int x, int y, int elevation, String terrain, String theme) {
		Hex hex = new Hex(x: x, y: y, elevation: elevation, theme: theme)
		hex.terrains = new HashSet()
		terrain?.tokenize(';').each { tk ->
			hex.terrains.add(Terrain.createTerrain(tk))
		}
		
		if(!hex.validate()) {
			hex.errors.allErrors.each {
				log.error(it)
			}
			return null
		}
		else {
			hex.save flush:true
			return hex
		}
	}
}
