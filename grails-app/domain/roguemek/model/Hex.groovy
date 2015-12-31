package roguemek.model

import org.grails.plugins.csv.CSVMapReader

import roguemek.assets.HexTileset

class Hex {
	
	String id
	static mapping= {
		id generator: 'uuid'
		
		// Model classes do not change values, versioning not needed
		version false
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
	 * Gets the total piloting modifiers for entry to this Hex
	 * @return
	 */
	public int getPilotingModifier() {
		int mods = 0
		for(Terrain t in terrains) {
			mods += t.getPilotingModifier()
		}
		
		return mods
	}
	
	/**
	 * Gets the total movement cost for entry to this Hex
	 * @return
	 */
	public int getMovementCost() {
		int cost = 0
		for(Terrain t in terrains) {
			cost += t.getMovementCost()
		}
		
		return cost
	}
	
	/**
	 * Sourced from MegaMek Hex.java
	 * @param type
	 * @return
	 */
	public int getTerrainLevel(int type) {
		for(Terrain t in terrains) {
			if(t.type == type) {
				return t.level
			}
		}
		
		return Terrain.LEVEL_NONE
	}
	
	/**
	 * Sourced from MegaMek Hex.java
	 * @param type
	 * @return
	 */
	public boolean containsTerrain(int type) {
		for(Terrain t in terrains) {
			if(t.type == type) {
				return true
			}
		}
		
		return false
	}
	
	/**
	 * Sourced from MegaMek Hex.java
	 * @param type
	 * @param level
	 * @return
	 */
	public boolean containsTerrain(int type, int level) {
		for(Terrain t in terrains) {
			if(t.type == type && t.level == level) {
				return true
			}
		}
		
		return false
	}
	
	/**
	 * Sourced from MegaMek Hex.java
	 * @param type
	 * @return
	 */
	public Terrain getTerrain(int type) {
		for(Terrain t in terrains) {
			if(t.type == type) {
				return t
			}
		}
		
		return null
	}
	
	/**
	 * @return a level indicating how far features in this hex extend below the surface level.
	 * 
	 * sourced from MegaMek Hex.java
	 */
	public int depth() {
		int depth = 0;
		Terrain water = this.getTerrain(Terrain.WATER);
		//Terrain basement = getTerrain(Terrain.BLDG_BASEMENT_TYPE);

		if (water != null) {
			depth += water.getLevel();
		}
		/*if (basement != null) {
			if (hidden) {
				depth += BasementType.getType(basement.getLevel()).getDepth();
			}
		}*/

		return depth;
	}
	
	/**
	 * @return the surface level of the hex
	 * 
	 * sourced from MegaMek Hex.java
	 */
	public int surface() {
		return this.elevation
	}
	
	/**
	 * Returns the lowest reachable point of this hex, used for
	 * terrain types that can extend below the surface of the hex, such as water
	 * and basements.  Unrevealed basements will not effect this value.
	 *
	 * @return the lowest level that revealed features in this hex extend to.
	 *         Below this level is assumed to be bedrock and/or basement.
	 *         Unrevealed basements will not effect this value.
	 *         
	 * sourced from MegaMek Hex.java
	 */
	public int floor() {
		return this.elevation - this.depth()
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
