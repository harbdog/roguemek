package roguemek.game

import org.grails.plugins.csv.CSVMapReader

import roguemek.model.Terrain
import roguemek.assets.HexTileset

class Hex {
	
	String id
	static mapping= {
		id generator: 'uuid'
	}
	
	Integer x
	Integer y
	Integer elevation
	String theme
	String[] images
	
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
		
		// Load terrains for the Hex
		hex.terrains = new HashSet()
		terrain?.tokenize(';').each { tk ->
			hex.terrains.add(Terrain.createTerrain(tk))
		}
		
		// Load images for the Hex
		hex.images = HexTileset.getImageArray(hex)
		
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
	
	/**
	 * Gets all applicable data for the object that can be turned into JSON for the client
	 * @return
	 */
	public def getHexRender() {
		def terrs = []
		this.terrains?.each { t ->
			terrs.add(t?.getTerrainRender())
		}
		
		def hexRender = [
			x: this.x,
			y: this.y,
			elevation: this.elevation,
			images: this.images,
			terrains: terrs
		]
		
		return hexRender
	}
	
	@Override
	public String toString() {
		return "<Hex("+x+","+y+"): ^"+elevation+" "+theme+" ***"+terrains.toString()+">"
	}
}
