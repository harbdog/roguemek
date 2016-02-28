package roguemek.game

import roguemek.MekUser

/** 
 * Domain class to store temporary data during Game staging only
 *
 */
class StagingGame {
	
	String id
	static mapping= {
		id generator: 'uuid'
	}
	
	static belongsTo = [game: Game]
	
	List chatUsers = []
	List stagingUsers = []
	
	static hasMany = [chatUsers: MekUser,
		// "staging" references exist only temporarily while the game is still being staged
		stagingUsers: StagingUser]
	
	/**
	 * Clears staging data for when the game goes from staging to active play
	 */
	public void clearStagingData() {
		def delStagingUsers = []
		for(def stageUser in stagingUsers) {
			delStagingUsers.add(stageUser)
		}
		
		stagingUsers = []
		save flush:true
		
		for(StagingUser stageUser in delStagingUsers) {
			stageUser.delete flush:true
		}
	}
	
	/**
	 * Adds the given user to the list of users currently connected to the chat
	 */
	public boolean addChatUser(MekUser user) {
		if(user == null) return false
		
		addToChatUsers(user)
		
		return save(flush:true)
	}
	
	/**
	 * Removes the given user from the list of currently connected chat users
	 */
	public boolean removeChatUser(MekUser user) {
		if(user == null) return false
		
		removeFromChatUsers(user)
		
		return save(flush:true)
	}
}
