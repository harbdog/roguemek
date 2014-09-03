package roguemek.game

class Game {
	private static final Date NULL_DATE = new Date(0)

	static hasMany = [pilots:Pilot, units:BattleUnit]
	Character gameState
	
	Date startDate = NULL_DATE
	Date updateDate = NULL_DATE
	
	// STATIC value mappings
	static GAME_ACTIVE = 'A'
	static GAME_PAUSED = 'P'
	static GAME_OVER = 'O'
	
    static constraints = {
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
}
