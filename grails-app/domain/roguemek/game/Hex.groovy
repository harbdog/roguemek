package roguemek.game

import java.util.LinkedHashMap;

import org.grails.plugins.csv.CSVMapReader
import roguemek.model.Terrain

class Hex {
	
	String hexCoords
	Integer elevation
	
	static hasMany = [terrains:Terrain]
	
    static constraints = {
		hexCoords nullable: false
		elevation nullable: false
    }
	
	/**
	 * Sourced from MegaMek Hex.java
	 * @param coords
	 * @param elevation
	 * @param terrain
	 * @return
	 */
	public static Hex createHex(String coords, int elevation, String terrain) {
		Hex hex = new Hex(hexCoords: coords, elevation: elevation)
		hex.terrains = new HashSet()
		for (StringTokenizer st = new StringTokenizer(terrain, ";", false); st.hasMoreTokens();) {
			hex.terrains.add(Terrain.createTerrain(st.nextToken()))
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
