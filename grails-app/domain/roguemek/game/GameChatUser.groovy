package roguemek.game

import roguemek.MekUser

/**
 * Stores simple mapping of which users are connected to chat for a game
 *
 */
class GameChatUser {
	
	String id
	static mapping= {
		id generator: 'uuid'
		version false
	}
	
	Game game
	MekUser chatUser
	
	static constraints = {
		game nullable: true
		chatUser nullable: false
	}
}
