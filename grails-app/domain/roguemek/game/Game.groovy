package roguemek.game

import roguemek.MekUser
import roguemek.model.Hex
import roguemek.model.HexMap

class Game {
	private static final Date NULL_DATE = new Date(0)
	
	private static final int turnsPerRound = 4
	
	String id
	static mapping= {
		id generator: 'uuid'
	}
	
	String description
	MekUser ownerUser
	
	List users
	List spectators
	List units
	static hasMany = [users:MekUser, spectators:MekUser, units:BattleUnit]
	
	Integer unitTurn = 0
	Integer gameTurn = 0
	Character gameState = GAME_INIT
	
	BattleHexMap board
	
	Date startDate = NULL_DATE
	Date updateDate = NULL_DATE
	
	// STATIC value mappings
	public static final Character GAME_INIT = 'I'
	public static final Character GAME_ACTIVE = 'A'
	public static final Character GAME_PAUSED = 'P'
	public static final Character GAME_OVER = 'O'
	
    static constraints = {
		description blank: false
		ownerUser nullable: false
		unitTurn min: 0
		gameTurn min: 0
		gameState inList: [GAME_INIT, GAME_ACTIVE, GAME_PAUSED, GAME_OVER]
		board nullable: false
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
	 * Gets a list of units owned by the given user
	 * @return
	 */
	public def getUnitsForUser(MekUser userInstance) {
		def unitsForUser = []
		
		if(userInstance == null) return unitsForUser
		
		for(BattleUnit unit in units) {
			MekUser user = unit.pilot?.ownerUser
			if(user.id == userInstance.id) {
				unitsForUser << unit
			}
		}
		
		return unitsForUser
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
		
		for(BattleUnit unit in units) {
			if(unit.pilot?.ownerUser == user) {
				return unit.pilot
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
		
		for(BattleUnit unit in units) {
			if(unit.pilot?.ownerUser == user) {
				return unit
			}
		}
		
		return null
	}
	
	public def loadMap() {
		return board.loadMap()
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
