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
			
			def startingLocation = game.getStartingLocationForUser(playerUser)
			
			generateUnitStartingPosition(game, unit, startingLocation)
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
					
					xMin = Math.floor(numHexCols / 2) - 2
					yMin = 0
					break
					
				case Game.STARTING_S:
					// at S, face N
					genHeading = 0
					
					xMin = Math.floor(numHexCols / 2) - 2
					yMin = numHexRows - 5
					break
				
				case Game.STARTING_W:
					// at W, face SE
					genHeading = 2
					
					xMin = 0
					yMin = Math.floor(numHexRows / 2) - 2
					break
					
				case Game.STARTING_E:
					// at E, face NW
					genHeading = 5
					
					xMin = numHexCols - 5
					yMin = Math.floor(numHexRows / 2) - 2
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
					
					xMin = numHexCols - 5
					yMin = numHexRows - 5
					break
					
				case Game.STARTING_NE:
					// at NE, face SW
					genHeading = 4
					
					xMin = numHexCols - 5
					yMin = 0
					break
					
				case Game.STARTING_SW:
					// at SW, face NE
					genHeading = 1
					
					xMin = 0
					yMin = numHexRows - 5
					break
					
				case Game.STARTING_CENTER:
					// at Center, face random
					genHeading = Roll.getDieRollTotal(1, 6) - 1
					
					xMin = Math.floor(numHexCols / 2) - 2
					yMin = Math.floor(numHexRows / 2) - 2
					break
					
				default: break
			}
			
			def hexAvailable = false;
			while(!hexAvailable){
				int randomX = Roll.getDieRollTotal(1, 5) - 1
				int randomY = Roll.getDieRollTotal(1, 5) - 1
				
				genLocation = new Coords(randomX + xMin, randomY + yMin)
				
				hexAvailable = !game.isHexOccupied(genLocation)
			}
		}
		
		unit.heading = genHeading
		unit.x = genLocation.x
		unit.y = genLocation.y
		
		unit.save flush:true
	}
}
