package roguemek.game

class GameHelper {
	Game game
	HexMap board
	
	public GameHelper(Game g) {
		this.game = g
		this.board = g.board
	}
	
	/**
	 * Gets all applicable data for the board HexMap object that can be turned into JSON for initializing the client
	 * @return
	 */
	public def getHexMapRender() {
		def hexList = []
		board.hexMap?.each { hexId ->
			Hex h = Hex.get(hexId)
			hexList.add(h?.getHexRender())
		}
		
		def hexMapRender = [
			numCols: board.numCols,
			numRows: board.numRows,
			hexMap: hexList
		]
		
		return hexMapRender
	}
	
	/**
	 * Gets all applicable data for all units that can be turned into JSON for initializing the client
	 * @return
	 */
	public def getUnitsRender() {
		def unitsRender = []
		
		game.units?.each { u ->
			def uRender = [
				unit: u.id,
				x: u.x,
				y: u.y,
				heading: u.heading,
				image: u.image
			]
			
			unitsRender.add(uRender)
		}
		
		return unitsRender
	}
	
	public def move(BattleUnit unit, boolean forward, boolean jumping) {
		// TODO: use actionPoints
		
		BattleUnit.setLocation(unit, this.getForwardCoords(unit.getLocation(), unit.heading))
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		return [
			unit: unit.id,
			x: unit.x,
			y: unit.y,
			heading: unit.heading
		]
	}
	
	public def rotateHeading(BattleUnit unit, int newHeading, boolean jumping){
		// TODO: use actionPoints
		
		unit.setHeading(newHeading);
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		return [
			unit: unit.id,
			x: unit.x,
			y: unit.y,
			heading: unit.heading
		]
	}
	
	// rotates the given heading Clockwise
	public def rotateHeadingCW(BattleUnit unit, boolean jumping){
		return this.rotateHeading(unit, GameHelper.getRotateHeadingCW(unit.heading), jumping);
	}
	public static int getRotateHeadingCW(heading){
		return (heading + 1) % 6;
	}
	
	// rotates the given heading Counter Clockwise
	public def rotateHeadingCCW(BattleUnit unit, boolean jumping){
		return this.rotateHeading(unit, GameHelper.getRotateHeadingCCW(unit.heading), jumping);
	}
	public static int getRotateHeadingCCW(heading){
		return (heading + 5) % 6;
	}
	
	// Gets the coordinate of the hex that would be in front of the given coordinates+heading
	public Coords getForwardCoords(Coords fromCoords, int heading) {
		def x = fromCoords.x;
		def y = fromCoords.y;
		
		def newXY = new Coords(x, y);
		switch(heading){
			case BattleUnit.HEADING_N:
				if(y > 0){
					newXY = new Coords(x,y-1);
				}
				break;
				
			case BattleUnit.HEADING_NE:
				if(x % 2 == 0 && x < board.numCols - 1 && y > 0){
					newXY = new Coords(x+1,y-1);
				}
				else if(x % 2 != 0 && x < board.numCols - 1){
					newXY = new Coords(x+1,y);
				}
				break;
				
			case BattleUnit.HEADING_SE:
				if(x % 2 == 0 && x < board.numCols - 1){
					newXY = new Coords(x+1,y);
				}
				else if(x % 2 != 0 && x < board.numCols - 1 && y < board.numRows - 1){
					newXY = new Coords(x+1,y+1);
				}
				break;
				
			case BattleUnit.HEADING_S:
				if(y < board.numRows - 1){
					newXY = new Coords(x,y+1);
				}
				break;
				
			case BattleUnit.HEADING_SW:
				if(x % 2 == 0 && x > 0){
					newXY = new Coords(x-1,y);
				}
				else if(x % 2 != 0 && x > 0 && y < board.numRows - 1){
					newXY = new Coords(x-1,y+1);
				}
				break;
				
			case BattleUnit.HEADING_NW:
				if(x % 2 == 0 && x > 0 && y > 0){
					newXY = new Coords(x-1,y-1);
				}
				else if(x % 2 != 0 && x > 0){
					newXY = new Coords(x-1,y);
				}
				break;
		}
		
		return newXY;
	}
	
}
