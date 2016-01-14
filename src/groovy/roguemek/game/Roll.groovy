package roguemek.game

import java.security.SecureRandom
import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

class Roll {
	private static Log log = LogFactory.getLog(this)
	
	public static SecureRandom random = new java.security.SecureRandom()
	
	// odds for 2d6 die roll (result as index)
	public static ODDS = [ 100, 100, 100, 97.2, 91.6, 83.3, 72.2, 58.3, 41.6, 27.7, 16.6, 8.3, 2.78, 0 ]
	
	public static int randomInt(int maxValue) {
		return randomInt(maxValue, 0)
	}
	
	public static int randomInt(int maxValue, int minValue) {
		int rolled = random.nextInt(maxValue) + minValue
		return rolled
	}
	
	public static int rollD6(int numRolls) {
		int total = 0
		for(int i=0; i<numRolls; i++) {
			total += randomInt(6, 1)
		}
		return total
	}
	
	public static int getDieRollTotal(int numRolls, int numSides) {
		int total = 0
		for(int i=0; i<numRolls; i++) {
			total += randomInt(numSides, 1)
		}
		return total
	}
}
