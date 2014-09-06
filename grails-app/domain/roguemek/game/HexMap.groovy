package roguemek.game

class HexMap {

	Integer numRows
	Integer numCols
	
	byte[][] map
	
    static constraints = {
		numRows min: 0
		numCols min: 0
		
		// setting map as bytes with a large maxSize
		// where by default H2 was creating as 255 bytes
		map maxSize: 1024
    }
}
