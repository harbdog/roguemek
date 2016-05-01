package roguemek.game

import roguemek.MekUser
import roguemek.model.Hex
import roguemek.model.HexMap

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

class Game {
	private static Log log = LogFactory.getLog(this)
	
	private static final Date NULL_DATE = new Date(0)
	
	String id
	static mapping = {
		id generator: 'uuid'
	}
	
	String description
	MekUser ownerUser
	
	Boolean privateGame = false
	
	Collection users
	Collection spectators
	List units
	
	static hasMany = [
		users:MekUser, 
		spectators:MekUser, 
		units:BattleUnit
	]
	
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
	public static final Character GAME_DELETED = 'D'
	
	public static final String STARTING_N = "N"
	public static final String STARTING_NE = "NE"
	public static final String STARTING_E = "E"
	public static final String STARTING_SE = "SE"
	public static final String STARTING_S = "S"
	public static final String STARTING_SW = "SW"
	public static final String STARTING_W = "W"
	public static final String STARTING_NW = "NW"
	public static final String STARTING_CENTER = "C"
	public static final String STARTING_RANDOM = "R"
	
	public static final def STARTING_LOCATIONS = [STARTING_NW, STARTING_N, STARTING_NE,
													STARTING_E, STARTING_SE, STARTING_S, 
													STARTING_SW, STARTING_W, STARTING_CENTER,
													STARTING_RANDOM]
	
    static constraints = {
		description blank: false
		ownerUser nullable: false
		unitTurn min: 0
		gameTurn min: 0
		gameState inList: [GAME_INIT, GAME_ACTIVE, GAME_PAUSED, GAME_OVER, GAME_DELETED]
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
	 * Clears staging data for when the game goes from staging to active play
	 */
	public void clearStagingData() {
		StagingUser.findAllByGame(this).each{ StagingUser stageUser ->
			stageUser.delete flush:true
		}
	}
	
	/**
	 * Gets a list of staged units owned by the given staged user
	 * @return
	 */
	public def getStagingUnitsForUser(MekUser userInstance) {
		def unitsForUser = []
		
		if(userInstance == null) return unitsForUser
		
		StagingUser.findByGameAndUser(this, userInstance).each { StagingUser stageUser ->
			unitsForUser.addAll(stageUser.units)
		}
		
		return unitsForUser
	}
	
	/**
	 * Gets a map of staged users with list of staged units controlled by that user
	 */
	public def getStagingUnitsByUser() {
		def unitsByUser = [:]
		
		StagingUser.findAllByGame(this).each{ StagingUser stageUser ->
			MekUser user = stageUser.user
			
			def unitList = []
			unitList.addAll(stageUser.units)
			
			unitsByUser[user] = unitList
		}
		
		return unitsByUser
	}
	
	/**
	 * Clears chat data for when the game is deleted or becomes inactive for play
	 */
	public void clearChatData() {
		GameChatUser.findAllByGame(this).each{ GameChatUser chatUser ->
			chatUser.delete flush:true
		}
	}
	
	/**
	 * Gets the team number for the given user in this game
	 * @return -1 if the user has no team, or a positive integer if it does
	 */
	public int getTeamForUser(MekUser userInstance) {
		GameTeam gTeam = GameTeam.findByGameAndUser(this, userInstance)
		return gTeam?.team ?: -1
	}
	
	/**
	 * Gets the team number for each user in this game
	 * @return keyed by user ID, value is negative number if the user has no team or a positive integer if it does
	 */
	public def getTeamsByUser() {
		def userTeams = [:]
		def noTeamNum = -1	// users not in a team will have negative "team" number to set them apart
		
		def gameTeams = GameTeam.findAllByGame(this)
		gameTeams?.each { gTeam ->
			userTeams[gTeam.user.id] = gTeam.team
		}
		
		users.each { user ->
			if(userTeams[user.id] == null) {
				userTeams[user.id] = noTeamNum --
			}
		}
		
		return userTeams
	}
	
	/**
	 * Returns true if all of the given users for this game are on the same team
	 * @return
	 */
	public boolean isSameTeam(List<MekUser> userInstanceList) {
		def teamUserCriteria = GameTeam.createCriteria()
		def teamUserList = teamUserCriteria.list {
			and {
				eq("game", this)
				'in'("user", userInstanceList)
			}
		}
		
		def prevTeamNum
		for(MekUser userInstance in userInstanceList) {
			def teamFound = false
			for(GameTeam gTeam in teamUserList) {
				if(gTeam.user.id == userInstance.id) {
					teamFound = true
					
					if(prevTeamNum == null) {
						prevTeamNum = gTeam.team
					}
					else if(prevTeamNum != gTeam.team){
						return false
					}
					
					break
				}
			}
			
			if(!teamFound) {
				return false
			}
		}
		
		return true
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
	 * Gets a map of users with list of units controlled by that user
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
	 * Returns true if any unit occupies the given Coords
	 * @return
	 */
	public boolean isHexOccupied(Coords c) {
		return (getUnitsAt(c).length > 0)
	}
	
	/**
	 * Gets all units found at the given Coords
	 * @param c
	 * @return
	 */
	public BattleUnit[] getUnitsAt(Coords c) {
		return getUnitsAt(c?.x, c?.y)
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
	
	/**
	 * Checks to see if the given user is in the game (by id compare)
	 * @param user
	 * @return
	 */
	public boolean hasUser(MekUser user) {
		if(user == null) return false
		
		for(MekUser chkUser in users) {
			if(user.id == chkUser.id) {
				return true
			}
		}
		
		return false
	}
	
	/**
	 * Checks to see if the given user is a spectator in the game (by id compare)
	 * @param user
	 * @return
	 */
	public boolean hasSpectator(MekUser user) {
		if(user == null) return false
		
		for(MekUser chkUser in spectators) {
			if(user.id == chkUser.id) {
				return true
			}
		}
		
		return false
	}
	
	/**
	 * Checks to see if the given user is participating as either a player, spectator, or owner of the game (by id compare)
	 * @param user
	 * @return
	 */
	public boolean isParticipant(MekUser user) {
		if(user == null) return false
		
		if(ownerUser.id == user.id) return true
		
		if(hasUser(user)) return true
		
		if(hasSpectator(user)) return true
		
		return false
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
