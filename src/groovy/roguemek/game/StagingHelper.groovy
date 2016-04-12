package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

import roguemek.MekUser

/**
 * Class used to contain methods for setting up a game based on its staging settings
 *
 */
class StagingHelper {
	private static Log log = LogFactory.getLog(this)
	
	/**
	 * Gets the units for the user based on staging data
	 * @param game
	 * @param userInstance
	 * @return
	 */
	public static def getUnitsForUser(Game game, MekUser userInstance) {
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData?.units) {
			return thisStagingData.units
		}
		
		return []
	}
	
	/**
	 * Gets the camo for the user based on staging data
	 * @param game
	 * @param userInstance
	 * @return
	 */
	public static def getCamoForUser(Game game, MekUser userInstance) {
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData?.rgbCamo) {
			return thisStagingData.rgbCamo
		}
		
		return userInstance.rgbColorPref
	}
	
	/**
	 * Gets the starting location for the user staging
	 * @param game
	 * @param userInstance
	 * @return
	 */
	public static String getStartingLocationForUser(Game game, MekUser userInstance) {
		StagingUser thisStagingData = getStagingForUser(game, userInstance)
		if(thisStagingData?.startingLocation) {
			return thisStagingData.startingLocation
		}
		
		return Game.STARTING_RANDOM
	}
	
	/**
	 * Gets the staging game information for the given user
	 */
	private static StagingUser getStagingForUser(Game game, MekUser userInstance) {
		if(game == null || userInstance == null) return null
		
		return StagingUser.findByGameAndUser(game, userInstance)
	}
}
