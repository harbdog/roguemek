package roguemek.game

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

/**
 * Message object used only to hold temporary message information to send back to the action caller
 */
class GameMessage {
	private static Log log = LogFactory.getLog(this)
	
	long time = 0
	String messageCode
	Object[] messageArgs
	def data
	
	public GameMessage(String messageCode, Object[] messageArgs, Map data) {
		this.time = new Date().getTime()
		this.messageCode = messageCode
		this.messageArgs = messageArgs
		this.data = data
	}
}
