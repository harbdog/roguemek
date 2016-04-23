package roguemek.model

import roguemek.assets.ContextHelper
import roguemek.board.MapBoard

class HexMap {
	
	String id
	static mapping= {
		id generator: 'uuid'
		
		// Model classes do not change values, versioning not needed
		version false
	}

	String name
	String path
	
	Boolean mapLoaded = false
	
	Integer numCols
	Integer numRows
	String size
	
	List hexMap
	static hasMany = [hexMap: String]
	
    static constraints = {
		name blank: false
		path blank: false
		mapLoaded nullable: false
		numRows min: 0
		numCols min: 0
		size nullable: true
    }
	
	def beforeInsert() {
		size = "${numCols}x${numRows}"
	}
	
	public def loadMap() {
		if(mapLoaded) {
			return this
		}
		else {
			return MapBoard.loadBoard(this)
		}
	}
	
	/**
	 * Gets the Hex object at the given x, y board coordinates
	 * @param x
	 * @param y
	 * @return
	 */
	public Hex getHexAt(int x, int y) {
		int index = (y * numCols) + x
		String hexId = hexMap[index]
		if(hexId == null ) {
			return null
		}
		
		return Hex.get(hexId)
	}
	
	@Override
	public String toString() {
		return this.name +" ("+this.numCols +"x"+ this.numRows+")"
	}
}
