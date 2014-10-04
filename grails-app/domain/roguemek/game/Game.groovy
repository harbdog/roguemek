package roguemek.game

class Game {
	private static final Date NULL_DATE = new Date(0)
	
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
	
	public BattleUnit getUnit(int index) {
		return units[index]
	}
}
