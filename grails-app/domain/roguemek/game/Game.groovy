package roguemek.game

import roguemek.MekUser
import roguemek.model.Hex;
import roguemek.model.HexMap;

class Game {
	private static final Date NULL_DATE = new Date(0)
	
	private static final int turnsPerRound = 4
	
	String id
	static mapping= {
		id generator: 'uuid'
	}
	
	String description

	MekUser ownerUser
	
	List pilots
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
		description blank: false
		ownerUser nullable: false
		unitTurn min: 0
		gameTurn min: 0
		gameState nullable: false
		board nullable: true
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
	 * Gets a map of users with list of units controller by that user
	 */
	public def getUnitsByUser() {
		def unitsByUser = [:]
		
		for(BattleUnit unit in units) {
			MekUser user = unit.pilot?.ownerUser
			
			def unitList = unitsByUser[user]
			if(unitList == null) {
				unitList = []
				unitsByUser[user] = unitList
			}
			
			unitList << unit
		}
		
		return unitsByUser
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
		def foundUnits = []
		int i = 0
		for(BattleUnit thisUnit in units) {
			if(!thisUnit.isDestroyed() && thisUnit.x == x && thisUnit.y == y) {
				foundUnits.add(thisUnit)
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
	
	/**
	 * Gets the Primary Pilot in the game for the given User
	 * @param user
	 * @return
	 */
	public Pilot getPrimaryPilotForUser(MekUser user) {
		if(user == null) return null
		for(Pilot pilot in pilots) {
			if(user == pilot.ownerUser) {
				return pilot
			}
		}
		return null
	}
	
	/**
	 * Gets the Primary Unit in the game for the given User
	 * @param user
	 * @return
	 */
	public BattleUnit getPrimaryUnitForUser(MekUser user) {
		if(user == null) return null
		
		// find using the primary pilot
		Pilot pilot = getPrimaryPilotForUser(user)
		if(pilot == null) return null
		for(BattleUnit unit in units) {
			if(pilot.id == unit.pilot.id) {
				return unit
			}
		}
		return null
	}
	
	public boolean isInit() {
		return (this.gameState == Game.GAME_INIT)
	}
	public boolean isActive() {
		return (this.gameState == Game.GAME_ACTIVE)
	}
	public boolean isPaused() {
		return (this.gameState == Game.GAME_PAUSED)
	}
	public boolean isOver() {
		return (this.gameState == Game.GAME_OVER)
	}
	
}
