package roguemek.chat

import java.util.Date

import roguemek.MekUser
import roguemek.game.Game

class ChatMessage {
	private static final Date NULL_DATE = new Date(0)
	
	String id
	MekUser user
	Date time = NULL_DATE
	String message
	
	static mapping = {
		id generator: 'uuid'
		version false
		message type: 'text'
	}
	
	// optional values that reference external resources
	String optGameId
	String recipient
	
    static constraints = {
		user nullable: true
		time nullable: false
		message blank: false
		
		// optGameId: optional ID of the game referenced by the message
		optGameId nullable: true
		// recipient: optional team numer (or later, user ID) of the recipient of the message
		recipient nullable: true
    }
	
	def beforeInsert() {
		if (time == NULL_DATE) {
			time = new Date()
		}
	}
}
