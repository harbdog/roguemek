package roguemek.game

import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentSkipListSet

import org.apache.commons.lang.time.DateUtils
import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

class GameMessage implements Comparable{
	private static Log log = LogFactory.getLog(this)
	
	Date date
	String message
	
	// Map used to store date[gameId]=[messages,...] for polling responses
	private static concurrentUpdates = new ConcurrentHashMap(16, 0.75, 16)
	private static int timeToKeepMessages = 5000	// in milliseconds
	private static Thread messageCleanupThread
	
	public GameMessage(String message) {
		this.date = new Date()
		this.message = message
	}
	
	public static void startMessageCleanupThread() {
		Runnable r = new Runnable() {
			public void run() {
				boolean flag = true;
				while(flag){
					Date compareDate = new Date(new Date().getTime() - timeToKeepMessages)
					for(Date keyDate in GameMessage.concurrentUpdates.keySet()) {
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
	
	public static Date addMessageUpdates(Game game) {
		if(messageCleanupThread == null || !messageCleanupThread.isAlive()) {
			log.error("Restarted GameMessage cleanup thread!")
			GameMessage.startMessageCleanupThread()
		}
		
		Date keyDate = DateUtils.round(new Date(), Calendar.SECOND)
		
		ConcurrentHashMap gameUpdates = GameMessage.concurrentUpdates.putIfAbsent(keyDate, new ConcurrentHashMap(5, 0.5, 5))
		if(gameUpdates == null) {
			gameUpdates = GameMessage.concurrentUpdates.get(keyDate)
		}
		
		ConcurrentSkipListSet timeUpdates = gameUpdates.putIfAbsent(game.id, new ConcurrentSkipListSet())
		if(timeUpdates == null) {
			timeUpdates = gameUpdates.get(game.id)
		}
		
		//Testing randomly generated number of messages
		int randNum = new Random().nextInt(4)
		String randMessage = "Game status message number " + new Random().nextInt(1000)
		for(int i=0; i<randNum; i++) {
			GameMessage gm = new GameMessage(randMessage)
			timeUpdates.add(gm)
		}
		
		log.info("added "+keyDate+" ("+game.id+"): "+timeUpdates)
		
		return keyDate
	}
	
	public static ConcurrentSkipListSet getMessageUpdates(Date sinceDate, Game game) {
		return null
	}

	@Override
	public int compareTo(Object o) {
		if(o instanceof GameMessage && o.date != null) {
			return this.date.compareTo(o.date)
		}
		
		return 1
	}
	
	@Override
	public String toString() {
		return "["+this.date+"] "+this.message
	}
}
