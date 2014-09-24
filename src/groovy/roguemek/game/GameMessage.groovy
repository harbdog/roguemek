package roguemek.game

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentSkipListSet

import org.apache.commons.lang.time.DateUtils
import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

class GameMessage implements Comparable{
	private static Log log = LogFactory.getLog(this)
	
	long time = 0
	String message = ""
	def data = []
	
	// Map used to store date[gameId]=[messages,...] for polling responses
	private static concurrentUpdates = new ConcurrentHashMap(16, 0.75, 16)
	private static int timeToKeepMessages = 5000	// in milliseconds
	private static Thread messageCleanupThread
	
	public GameMessage(String message, Map data) {
		this.time = new Date().getTime()
		this.message = message
		this.data = data
	}
	
	public static void startMessageCleanupThread() {
		Runnable r = new Runnable() {
			public void run() {
				boolean flag = true;
				while(flag){
					Date compareDate = new Date(new Date().getTime() - timeToKeepMessages)
					for(Date keyDate in GameMessage.concurrentUpdates.keys()) {
						if(keyDate.before(compareDate)) {
							GameMessage.concurrentUpdates.remove(keyDate)
						}
					}
					
					try {
						Thread.sleep(timeToKeepMessages);
					} catch (InterruptedException e) {
						e.printStackTrace();
					}
				}
			}
		};
	
		messageCleanupThread = new Thread(r)
		messageCleanupThread.start()	// start thread in the background
	}
	
	public static Date addMessageUpdate(Game game, String message, Map data) {
		if(messageCleanupThread == null || !messageCleanupThread.isAlive()) {
			log.error("Restarted GameMessage cleanup thread!")
			GameMessage.startMessageCleanupThread()
		}
		
		Date keyDate = GameMessage.getKeyDate(new Date())
		
		ConcurrentHashMap gameUpdates = GameMessage.concurrentUpdates.putIfAbsent(keyDate, new ConcurrentHashMap(5, 0.5, 5))
		if(gameUpdates == null) {
			gameUpdates = GameMessage.concurrentUpdates.get(keyDate)
		}
		
		ConcurrentSkipListSet timeUpdates = gameUpdates.putIfAbsent(game.id, new ConcurrentSkipListSet())
		if(timeUpdates == null) {
			timeUpdates = gameUpdates.get(game.id)
		}
		
		// create and add the game message with the info
		GameMessage gm = new GameMessage(message, data)
		timeUpdates.add(gm)
		
		return new Date(gm.time)
	}
	
	/**
	 * Gets only the messages that have been created in the given game since the date provided
	 * @param sinceDate
	 * @param game
	 * @return
	 */
	public static List getMessageUpdates(Date sinceDate, Game game) {
		ArrayList updates = new ArrayList()
		
		// The date to use for key comparison needs to be slightly earlier than the sinceDate to 
		// account for rounding of the date keys used in the hash 
		long sinceTime = sinceDate.getTime()
		Date compareDate = new Date(sinceTime - 500)
		
		for(Date keyDate in GameMessage.concurrentUpdates.keys()) {
			if(keyDate.before(compareDate)) {
				// only interested in key dates at or after the comparison date
				continue
			}
			
			ConcurrentHashMap gameUpdates = GameMessage.concurrentUpdates.get(keyDate)
			ConcurrentSkipListSet timeUpdates = gameUpdates.get(game.id)
			
			if(timeUpdates == null) {
				// no messages for this game during this time
				continue
			}
			
			GameMessage compareGM = new GameMessage(null, null)
			compareGM.time = sinceTime
			updates.addAll(timeUpdates.tailSet(compareGM, false))
		}
		
		// sort the array by the GameMessage times
		Collections.sort(updates)
		
		return updates
	}
	
	/**
	 * Generates the date key that will be used to keep messages together by chunks of time
	 * @return
	 */
	private static Date getKeyDate(Date srcDate) {
		return DateUtils.round(srcDate, Calendar.SECOND)
	}

	@Override
	public int compareTo(Object o) {
		if(o instanceof GameMessage && o.time != null) {
			return this.time.compareTo(o.time)
		}
		
		return 1
	}
	
	@Override
	public String toString() {
		return "["+this.time+"] "+this.message+" {"+this.data+"}"
	}
}
