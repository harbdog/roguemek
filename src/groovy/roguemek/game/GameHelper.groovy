package roguemek.game

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

class GameHelper {
	private static Log log = LogFactory.getLog(this)
	
	Game game
	HexMap board
	
	public GameHelper(Game g) {
		this.game = g
		this.board = g.board
	}
	
	/**
	 * Starts the game so it is ready to play the first turn
	 */
	public def initializeGame() {
		if(this.game.gameState != Game.GAME_INIT) return
		
		this.game.gameState = Game.GAME_ACTIVE
		this.game.gameTurn = 0
		
		// TODO: perform initiative roll on first and every 4 turns after to change up the order of the units turn
		// this.game.units...
		this.game.unitTurn = 0
		
		// get the first unit ready for its turn
		initializeTurnUnit()
		
		this.game.save flush: true
	}
	
	/**
	 * Starts the next unit's turn
	 * @return
	 */
	public def initializeNextTurn() {
		this.game.unitTurn ++
		// TODO: account for destroyed units
		
		if(this.game.unitTurn >= this.game.units.size()) {
			this.game.gameTurn ++
			this.game.unitTurn = 0
		}
		
		// update the next unit for its new turn
		initializeTurnUnit()
		
		this.game.save flush: true
		
		// TODO: return and add game message about the next unit's turn
		BattleUnit turnUnit = this.game.units.get(this.game.unitTurn)
		def data = [
			turnUnit: turnUnit.id,
			actionPoints: turnUnit.actionPoints,
		]
		
		Date update = GameMessage.addMessageUpdate(this.game, "New turn for Unit "+turnUnit+".", data)
		
		return data
	}
	
	/**
	 * Initializes the unit for its next turn (updates AP, heat, etc.)
	 * @return
	 */
	private def initializeTurnUnit() {
		BattleUnit unit = this.game.units.get(this.game.unitTurn)
		// TODO: generate actual amount of AP/JP per turn
		unit.actionPoints = 3
		unit.jumpPoints = 0
		
		// TODO: update unit.heat value based on heat sinks and current heat amount 
		// unit.heat = ...
		
		unit.damageTakenThisTurn = 0
		
		unit.save flush: true
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
			
			def chassisVariant = u.mech ? u.mech.chassis+"-"+u.mech.variant : null
			
			def armor = []
			if(u.armor != null) {
				for(int i=0; i<u.armor.length; i++) {
					armor[i] = u.armor[i]
				}
			}
			
			def internals = []
			if(u.internals != null) {
				for(int i=0; i<u.internals.length; i++) {
					internals[i] = u.internals[i]
				}
			}
			
			def uRender = [
				unit: u.id,
				callsign: u.pilot?.ownerUser?.callsign,
				name: u.mech?.name,
				chassisVariant: chassisVariant,
				x: u.x,
				y: u.y,
				heading: u.heading,
				actionPoints: u.actionPoints,
				jumpPoints: u.jumpPoints,
				heat: u.heat,
				armor: armor,
				internals: internals,
				image: u.image,
				rgb: [u.rgb[0], u.rgb[1], u.rgb[2]]
			]
			
			unitsRender.add(uRender)
		}
		
		return unitsRender
	}
	
	public def move(BattleUnit unit, boolean forward, boolean jumping) {
		if(unit.actionPoints == 0) return
		
		// TODO: use actionPoints
		unit.actionPoints -= 1
				
		def moveHeading = forward ? unit.heading : ((unit.heading + 3) % 6)
		
		// When ready to move, set the new location of the unit
		BattleUnit.setLocation(unit, this.getForwardCoords(unit.getLocation(), moveHeading))
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		def data = [
			unit: unit.id,
			x: unit.x,
			y: unit.y,
			actionPoints: unit.actionPoints
		]
		
		Date update = GameMessage.addMessageUpdate(this.game, "Unit "+unit+" moved to "+unit.x+","+unit.y, data)
		
		if(unit.actionPoints == 0) {
			// automatically end the unit's turn if it has run out of AP
			this.initializeNextTurn()
		}
		
		return data
	}
	
	public def rotateHeading(BattleUnit unit, int newHeading, boolean jumping){
		if(unit.actionPoints == 0) return
		
		// TODO: use actionPoints
		unit.actionPoints -= 1
		
		// When ready to rotate, set the new location of the unit
		unit.setHeading(newHeading);
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		def data = [
			unit: unit.id,
			heading: unit.heading,
			actionPoints: unit.actionPoints
		]
		
		Date update = GameMessage.addMessageUpdate(this.game, "Unit "+unit+" rotated to heading "+unit.heading, data)
		
		if(unit.actionPoints == 0) {
			// automatically end the unit's turn if it has run out of AP
			this.initializeNextTurn()
		}
		
		return data
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
