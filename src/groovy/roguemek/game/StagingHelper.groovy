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
	 * Applies staging settings to game elements
	 * @param game
	 */
	public static void stageGame(Game game) {
		// clear locations for each unit
		for(BattleUnit unit in game.units) {
			if(unit.x != null || unit.y != null) {
				unit.x = null
				unit.y = null
				
				unit.save flush:true
			}
		}
		
		// determine starting locations for each unit (in reverse order so the units nearer the edge will be last to move)
		for(BattleUnit unit in game.units.reverse()) {
			MekUser playerUser = unit.getPlayerUser()
			
			def startingLocation = StagingHelper.getStartingLocationForUser(game, playerUser)
			
			StagingHelper.generateUnitStartingPosition(game, unit, startingLocation)
		}
	}
	
	/**
	 * Generates and saves the starting position for the given unit based on the set starting location
	 * @param game
	 * @param unit
	 * @param startingLocation
	 * @return
	 */
	public static void generateUnitStartingPosition(Game game, BattleUnit unit, String startingLocation) {
		Coords genLocation = null;
		int genHeading = 0;
		
		int numHexCols = game.board.numCols()
		int numHexRows = game.board.numRows()
		
		if(Game.STARTING_RANDOM.equals(startingLocation)){
			// this unit has completely random starting locations and headings anywhere on the board
			genLocation = new Coords(0,0);
			genHeading = Roll.getDieRollTotal(1, 6) - 1;
			
			def hexAvailable = false;
			while(!hexAvailable){
				int randomX = Roll.getDieRollTotal(1, numHexCols) - 1;
				int randomY = Roll.getDieRollTotal(1, numHexRows) - 1;
				
				genLocation = new Coords(randomX, randomY);
				
				hexAvailable = !game.isHexOccupied(genLocation);
			}
		}
		else {
			int xMin = 1;
			int yMin = 1;
			
			// the headings are based on the closest opposite direction of the area they are starting in
			switch(startingLocation){
				case Game.STARTING_N:
					// at N, face S
					genHeading =  3
					
					xMin = Math.floor(numHexCols / 2)
					yMin = 0
					break
					
				case Game.STARTING_S:
					// at S, face N
					genHeading = 0
					
					xMin = Math.floor(numHexCols / 2)
					yMin = numHexRows - 5
					break
				
				case Game.STARTING_W:
					// at W, face SE
					genHeading = 2
					
					xMin = 0
					yMin = Math.floor(numHexRows / 2)
					break
					
				case Game.STARTING_E:
					// at E, face NW
					genHeading = 5
					
					xMin = numHexCols - 5
					yMin = Math.floor(numHexRows / 2)
					break
					
				case Game.STARTING_NW:
					// at NW, face SE
					genHeading = 2
					
					xMin = 0
					yMin = 0
					break
					
				case Game.STARTING_SE:
					// at SE, face NW
					genHeading = 5
					
					xMin = numHexCols - 1
					yMin = numHexRows - 1
					break
					
				case Game.STARTING_NE:
					// at NE, face SW
					genHeading = 4
					
					xMin = numHexCols - 1
					yMin = 0
					break
					
				case Game.STARTING_SW:
					// at SW, face NE
					genHeading = 1
					
					xMin = 0
					yMin = numHexRows - 1
					break
					
				case Game.STARTING_CENTER:
					// at Center, face random
					genHeading = Roll.getDieRollTotal(1, 6) - 1
					
					xMin = Math.floor(numHexCols / 2) - 1
					yMin = Math.floor(numHexRows / 2) - 1
					break
					
				default: break
			}
			
			// try starting at the given corner/edge
			genLocation = new Coords(xMin, yMin)
			
			// check the exact location of the corner/edge first
			def hexAvailable = !game.isHexOccupied(genLocation)
			
			def hexDistance = 1
			def numCols = game.getBoard().getMap().getNumCols()
			def numRows = game.getBoard().getMap().getNumRows()
			while(!hexAvailable){
				// start moving away from the origination point until an open hex is found
				def tryCoords = []
				
				for(int thisX=-hexDistance; thisX<=hexDistance; thisX++) {
					for(int thisY=-hexDistance; thisY<=hexDistance; thisY++) {
						Coords thisCoord = new Coords(thisX + xMin, thisY + yMin)
						
						if(thisCoord.x >= 0 && thisCoord.y >= 0
								&& thisCoord.x < numCols && thisCoord.y < numRows){
							tryCoords.add(thisCoord)
						}
					}
				}
				
				// start going through the coords at random
				Collections.shuffle(tryCoords)
				
				for(Coords thisCoord in tryCoords) {
					hexAvailable = !game.isHexOccupied(thisCoord)
					if(hexAvailable) {
						genLocation = thisCoord
						break
					}
				}
				
				hexDistance ++
			}
		}
		
		unit.heading = genHeading
		unit.x = genLocation.x
		unit.y = genLocation.y
		
		unit.save flush:true
	}
	
	/**
	 * Gets the camo for the user based on staging data
	 * @param game
	 * @param userInstance
	 * @return
	 */
	public static def getCamoForUser(Game game, MekUser userInstance) {
		for(StagingUser stagingData in game?.stagingUsers) {
			if(stagingData.user.id == userInstance?.id) {
				return stagingData.rgbCamo
			}
		}
		
		return userInstance.rgbColorPref
	}
	
	/**
	 * Sets the camo for the user staging
	 * @param game
	 * @param userInstance
	 * @param camo
	 * @return
	 */
	public static boolean setCamoForUser(Game game, MekUser userInstance, def camo) {
		if(game == null || userInstance == null) return false
		
		StagingUser thisStagingData
		
		for(StagingUser stagingData in game.stagingUsers) {
			if(stagingData.user.id == userInstance?.id) {
				thisStagingData = stagingData
				break
			}
		}
		
		def saveGameNeeded = false
		
		if(thisStagingData == null) {
			thisStagingData = new StagingUser(user: userInstance, game: game, rgbCamo: camo)
			game.stagingUsers.add(thisStagingData)
			
			saveGameNeeded = true
		}
		else{
			thisStagingData.rgbCamo = camo
		}
		
		thisStagingData.validate()
		if(thisStagingData.hasErrors()) {
			log.error(thisStagingData.errors)
			return false
		}
		
		thisStagingData.save flush:true
		
		if(saveGameNeeded) {
			game.save flush:true
		}
		
		// also save the color as preference on the user for later use
		userInstance.rgbColorPref = camo
		userInstance.save flush:true
		
		return true
	}
	
	/**
	 * Gets the starting location for the user staging
	 * @param game
	 * @param userInstance
	 * @return
	 */
	public static String getStartingLocationForUser(Game game, MekUser userInstance) {
		for(StagingUser stagingData in game?.stagingUsers) {
			if(stagingData.user.id == userInstance?.id) {
				return stagingData.startingLocation
			}
		}
		
		return Game.STARTING_RANDOM
	}
	
	/**
	 * Sets the starting location for the user based on staging data
	 * @param game
	 * @param userInstance
	 * @param location
	 * @return
	 */
	public static boolean setStartingLocationForUser(Game game, MekUser userInstance, String location) {
		if(game == null || userInstance == null) return false
		
		StagingUser thisStagingData
		
		for(StagingUser stagingData in game.stagingUsers) {
			if(stagingData.user.id == userInstance?.id) {
				thisStagingData = stagingData
				break
			}
		}
		
		if(thisStagingData == null) {
			thisStagingData = new StagingUser(user: userInstance, game: game, startingLocation: location)
			game.stagingUsers.add(thisStagingData)
		}
		else{
			thisStagingData.startingLocation = location
		}
		
		thisStagingData.validate()
		if(thisStagingData.hasErrors()) {
			log.error(thisStagingData.errors)
			return false
		}
		
		thisStagingData.save flush:true
		
		return true
	}
}
