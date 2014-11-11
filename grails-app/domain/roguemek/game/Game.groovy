package roguemek.game

class Game {
	private static final Date NULL_DATE = new Date(0)
	
	private static final int turnsPerRound = 4
	
	String id
	static mapping= {
		id generator: 'uuid'
	}

	Pilot ownerPilot
	
	List units
	static hasMany = [pilots:Pilot, units:BattleUnit]
	Integer unitTurn = 0
	
	Integer gameTurn = 0
	Character gameState = GAME_INIT
	
	HexMap board
	
	Date startDate = NULL_DATE
	Date updateDate = NULL_DATE
	
	// STATIC value mappings
	public static final GAME_INIT = 'I'
	public static final GAME_ACTIVE = 'A'
	public static final GAME_PAUSED = 'P'
	public static final GAME_OVER = 'O'
	
    static constraints = {
		ownerPilot nullable: false
		unitTurn min: 0
		gameTurn min: 0
		gameState nullable: false
    }
	
	def beforeInsert() {
		if (startDate == NULL_DATE) {
		   startDate = new Date()
		   updateDate = startDate
		}
	}
	
	def beforeUpdate() {
		updateDate = new Date()
	}
	
	/**
	 * Gets the unit at the given index of the unit list
	 * @param index
	 * @return
	 */
	public BattleUnit getUnit(int index) {
		return units[index]
	}
	
	/**
	 * Gets the unit at the unitTurn index of the unit list
	 * @return
	 */
	public BattleUnit getTurnUnit() {
		return units[unitTurn]
	}
	
	/**
	 * Gets all units found at the given x,y location
	 * @param x
	 * @param y
	 * @return
	 */
	public BattleUnit[] getUnitsAt(int x, int y) {
		BattleUnit[] foundUnits = []
		int i = 0
		for(BattleUnit thisUnit in units) {
			if(thisUnit.x == x && thisUnit.y == y) {
				foundUnits[i++] = thisUnit
			}
		}
		
		return foundUnits
	}
	
	/**
	 * Gets the Hex at the given x,y location
	 * @param x
	 * @param y
	 * @return
	 */
	public Hex getHexAt(Coords c) {
		return board.getHexAt(c.x, c.y)
	}
}
