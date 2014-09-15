package roguemek.game

class Game {
	private static final Date NULL_DATE = new Date(0)

	Pilot ownerPilot
	
	static hasMany = [pilots:Pilot, units:BattleUnit]
	Character gameState = GAME_ACTIVE
	
	HexMap board
	
	Date startDate = NULL_DATE
	Date updateDate = NULL_DATE
	
	// STATIC value mappings
	public static final GAME_ACTIVE = 'A'
	public static final GAME_PAUSED = 'P'
	public static final GAME_OVER = 'O'
	
    static constraints = {
		ownerPilot nullable: false
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
	
	public def getUnitsRender() {
		def unitsRender = []
		
		this.units?.each { u ->
			def uRender = [
				x: u.x,
				y: u.y,
				image: u.image
			]
			
			unitsRender.add(uRender)
		}
		
		return unitsRender
	}
}
