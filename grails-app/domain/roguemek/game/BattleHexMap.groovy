package roguemek.game

import roguemek.model.HexMap
import roguemek.model.Hex

class BattleHexMap {
	
	String id
	static mapping= {
		id generator: 'uuid'
	}

	HexMap map
	Integer timeOfDay = 1200
	
	// TODO: atmospheric/weather conditions
	
    static constraints = {
		map nullable: true
		timeOfDay min: 0, max: 2400
    }
	
	public String name() {
		return map?.name
	}
	
	public String mapId() {
		return map?.id
	}
	
	public Integer numCols() {
		return map ? map.numCols : 0
	}
	
	public Integer numRows() {
		return map ? map.numRows : 0
	}
	
	public HexMap getHexMap() {
		return map
	}
	
	/**
	 * Gets the Hex object at the given x, y board coordinates
	 * @param x
	 * @param y
	 * @return
	 */
	public Hex getHexAt(int x, int y) {
		if(map == null) return null
		
		int index = (y * map.numCols) + x
		String hexId = map.hexMap[index]
		if(hexId == null ) {
			return null
		}
		
		return Hex.get(hexId)
	}
	
	@Override
	public String toString() {
		return map?.toString()
	}
}
