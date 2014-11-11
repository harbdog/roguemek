package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import roguemek.model.Terrain

/**
 * Contains source code that is very useful when performing hex based mathematics
 * and other complicated BT specific calculations
 * Sourced from MegaMek Compute.java
 *
 */
class Compute {
	private static Log log = LogFactory.getLog(this)
	
	/**
	 * class to store line of sight impedences
	 * based off of the same class from MegaMek (LosEffects.java)
	 */
	static class LosEffects {
		public def blocked = false
		public def lightWoods = 0
		public def heavyWoods = 0
		public def smoke = 0
		public def targetCover = false  	// that means partial cover
		public def attackerCover = false  // also means partial cover
		
		public void add(LosEffects other) {
			this.blocked |= other.blocked;
			this.lightWoods += other.lightWoods;
			this.heavyWoods += other.heavyWoods;
			this.smoke += other.smoke;
			this.targetCover |= other.targetCover;
			this.attackerCover |= other.attackerCover;
		}
		
		public String toString() {
			return "[blocked="+this.blocked+", lightWoods="+this.lightWoods+", heavyWoods="
					+this.heavyWoods+", targetCover="+this.targetCover+", attCover="+this.attackerCover+"]"
		}
	}
	
	/**
	 * Returns a LosEffects object representing the LOS effects of interveing
	 * terrain between the attacker and target.
	 *
	 * Checks to see if the attacker and target are at an angle where the LOS
	 * line will pass between two hexes.  If so, calls losDivided, otherwise
	 * calls losStraight.
	 *
	 * based off of the same method from MegaMek (LosEffects.java)
	 */
	public static def calculateLos(Game game, Coords sourceC, Coords targetC) {
	
		if (sourceC == null || targetC == null) {
			def los = new LosEffects()
			los.blocked = true
			return los
		}
		
		def degree = getDegree(sourceC, targetC)
		if (degree % 60 == 30) {
			return losDivided(game, sourceC, targetC)
		} else {
			return losStraight(game, sourceC, targetC)
		}
	}
	
	/**
	 * Returns the degree direction of another Coords.
	 * based off of the same method from MegaMek (Coords.java)
	 */
	public static def getDegree(Coords sourceC, Coords targetC){
		return Math.round((180 / Math.PI) * sourceC.radian(targetC))
	}
	
	/**
	 * Returns LosEffects for a line that never passes exactly between two
	 * hexes.  Since intervening() returns all the coordinates, we just
	 * add the effects of all those hexes.
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static def losStraight(Game game, Coords sourceC, Coords targetC) {
		log.info("losStraight: "+sourceC+"->"+targetC)
		
		def interveningCoords = intervening(game, sourceC, targetC)
		
		def los = new LosEffects()
	
		for (def i = 0; i < interveningCoords.size(); i++) {
			los.add( losForCoords(game, sourceC, targetC, interveningCoords[i]) )
		}
	
		return los
	}
	
	/**
	 * Returns LosEffects for a line that passes between two hexes at least
	 * once.  The rules say that this situation is resolved in favor of the
	 * defender.
	 *
	 * The intervening() function returns both hexes in these circumstances,
	 * and, when they are in line order, it's not hard to figure out which hexes
	 * are split and which are not.
	 *
	 * The line always looks like:
	 *       ___     ___
	 *   ___/ 1 \___/...\___
	 *  / 0 \___/ 3 \___/etc\
	 *  \___/ 2 \___/...\___/
	 *      \___/   \___/
	 *
	 * We go thru and figure out the modifiers for the non-split hexes first.
	 * Then we go to each of the two split hexes and determine which gives us
	 * the bigger modifier.  We use the bigger modifier.
	 *
	 * This is not perfect as it takes partial cover as soon as it can, when
	 * perhaps later might be better.
	 * Also, it doesn't account for the fact that attacker partial cover blocks
	 * leg weapons, as we want to return the same sequence regardless of
	 * what weapon is attacking.
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static def losDivided(Game game, Coords sourceC, Coords targetC) {
		log.info("losDivided: "+sourceC+"->"+targetC)
		
		def interveningCoords = intervening(game, sourceC, targetC)
		
		def los = new LosEffects()
		
		Hex sourceHex = game.getHexAt(sourceC)
		Hex targetHex = game.getHexAt(targetC)
		
		//TODO: something needed for elevation difference?
		def isElevDiff = ( sourceHex.elevation != targetHex.elevation )
	
		// add non-divided line segments
		for (def i = 3; i < interveningCoords.size() - 2; i += 3) {
			los.add( losForCoords(game, sourceC, targetC, interveningCoords[i]) )
		}
		
		// if blocked already, return that
		def losMods = losModifiers(los);
		if (getSumModifiers(losMods) == -1) {
			return los
		}
		
		// go through divided line segments
		for (def i = 1; i < interveningCoords.size() - 2; i += 3) {
			// get effects of each side
			LosEffects left = losForCoords(game, sourceC, targetC, interveningCoords[i])
			LosEffects right = losForCoords(game, sourceC, targetC, interveningCoords[i+1])
	
			// Include all previous LOS effects.
			left.add(los)
			right.add(los)
	
			// which is better?
			def lMods = losModifiers(left)
			def rMods = losModifiers(right)
			
			def lVal = getSumModifiers(lMods)
			def rVal = getSumModifiers(rMods)
			
			if (lVal > rVal || (lVal == rVal && left.attackerCover == 1)) {
				los = left
			} else {
				los = right
			}
		}
		
		return los
	}
	
	/**
	 * Returns an array of the Coords of hexes that are crossed by a straight
	 * line from the center of src to the center of dest, including src & dest.
	 *
	 * The returned coordinates are in line order, and if the line passes
	 * directly between two hexes, it returns them both.
	 *
	 * Based on the degree of the angle, the next hex is going to be one of
	 * three hexes.  We check those three hexes, sides first, add the first one
	 * that intersects and continue from there.
	 *
	 * Based off of some of the formulas at Amit's game programming site.
	 * (http://www-cs-students.stanford.edu/~amitp/gameprog.html)
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static def intervening(Game game, Coords srcCoord, Coords destCoord) {
		def iSrc = new IdealHex(srcCoord)
		def iDest = new IdealHex(destCoord)
		
		def directions = []
		directions[2] = srcCoord.direction(destCoord)	// center last
		directions[1] = (directions[2] + 5) % 6
		directions[0] = (directions[2] + 1) % 6
		
		def hexes = []
		def currentCoord = srcCoord
		
		hexes.push(currentCoord)
		while(!destCoord.equals(currentCoord)) {
			currentCoord = nextHex(currentCoord, iSrc, iDest, directions)
			hexes.push(currentCoord)
		}
	
		return hexes;
	}
	
	/**
	 * Returns the first further hex found along the line from the centers of
	 * src to dest.  Checks the three directions given and returns the closest.
	 *
	 * This relies on the side directions being given first.  If it checked the
	 * center first, it would end up missing the side hexes sometimes.
	 *
	 * Not the most elegant solution, but it works.
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static def nextHex(Coords currentCoord, IdealHex iSrc, IdealHex iDest, def directions) {
		for (def i = 0; i < directions.size(); i++) {
			def testing = currentCoord.translated(directions[i])
			
			def testIdealHex = new IdealHex(testing)
			
			if (testIdealHex.isIntersectedBy(iSrc.cx, iSrc.cy, iDest.cx, iDest.cy)) {
				return testing
			}
		}
		// if we're here then something's fishy!
		throw new RuntimeException("Couldn't find the next hex!")
	}
	
	/**
	 * Returns a LosEffects object representing the LOS effects of anything at
	 * the specified coordinate.
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static LosEffects losForCoords(Game game, Coords sourceC, Coords targetC, Coords thisCoord) {
		LosEffects los = new LosEffects()
	
		// ignore hexes the attacker or target are in
		if ( thisCoord.equals(sourceC) ||  thisCoord.equals(targetC) ) {
			return los
		}
		
		Hex sourceHex = game.getHexAt(sourceC)
		Hex targetHex = game.getHexAt(targetC)
		Hex thisHex = game.getHexAt(thisCoord)
		
		if(thisHex == null){
			log.info("   HEX NULL")
			return los
		}
		
		log.info("   HEX: "+thisHex)
		
		// set up elevations
		def srcEl = sourceHex.elevation + 1		//TODO: the +1 for source represents it is standing, prone would be +0
		def targEl = targetHex.elevation + 1	//TODO: the +1 for target represents it is standing, prone would be +0
		def hexEl = thisHex.elevation;
		
		// TODO: buildings?
		def bldgEl = 0
	
		// check for block by terrain
		if ((hexEl + bldgEl > srcEl && hexEl + bldgEl > targEl)
				|| (hexEl + bldgEl > srcEl && sourceC.distance(thisCoord) == 1)
				|| (hexEl + bldgEl > targEl && targetC.distance(thisCoord) == 1)) {
			los.blocked = true
		}
	
		// check for woods or smoke
		if ((hexEl + 2 > srcEl && hexEl + 2 > targEl)
				|| (hexEl + 2 > srcEl && sourceC.distance(thisCoord) == 1)
				|| (hexEl + 2 > targEl && targetC.distance(thisCoord) == 1)) {
			// smoke overrides any woods in the hex
			if (false) {
				//TODO: implement smoke
				los.smoke ++
			}
			
			int woodsLevel = thisHex.getTerrainLevel(Terrain.WOODS)
			int jungleLevel = thisHex.getTerrainLevel(Terrain.JUNGLE)
			
			if (woodsLevel == 1 || jungleLevel == 1) {
				los.lightWoods ++
			}
			else if (woodsLevel == 2 || jungleLevel == 2) {
				los.heavyWoods ++
			}
		}
		
		// check for target partial cover
		if (targetC.distance(thisCoord) == 1 && hexEl + bldgEl == targEl && srcEl <= targEl) {
				//srcEl <= targEl && target.getHeight() > 0) {	// TODO: implement height 0 as prone
			los.targetCover = true
		}
	
		// check for attacker partial cover
		if (sourceC.distance(thisCoord) == 1 &&
				hexEl + bldgEl == srcEl &&
				srcEl >= targEl) {
				//srcEl >= targEl && ae.height() > 0) {			// TODO: implement height 0 as prone
			los.attackerCover = true
		}
		
		return los
	}
	
	/**
	 * Returns ToHitData indicating the modifiers to fire for the specified
	 * LOS effects data.
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static def losModifiers(LosEffects los) {
		
		def losMods = []
	
		if (los.blocked) {
			losMods.push(new WeaponModifier(WeaponModifier.Modifier.IMPOSSIBLE, WeaponModifier.AUTO_MISS))	//"LOS blocked by terrain."
			return losMods
		}
		
		if (los.lightWoods + (los.heavyWoods * 2) > 2) {
			losMods.push(new WeaponModifier(WeaponModifier.Modifier.IMPOSSIBLE, WeaponModifier.AUTO_MISS))	//"LOS blocked by woods."
			return losMods;
		}
		
		if (los.smoke > 1) {
			losMods.push(new WeaponModifier(WeaponModifier.Modifier.IMPOSSIBLE, WeaponModifier.AUTO_MISS))	//"LOS blocked by smoke."
			return losMods
		}
		
		if (los.smoke == 1) {
			if (los.lightWoods + los.heavyWoods > 0) {
				losMods.push(new WeaponModifier(WeaponModifier.Modifier.IMPOSSIBLE, WeaponModifier.AUTO_MISS))	//"LOS blocked by smoke and woods."
				return losMods
			} else {
				//modifiers.addWeaponModifier(2, "intervening smoke");		// TODO: smoke modifier
			}
		}
		
		if (los.lightWoods > 0) {
			losMods.push(new WeaponModifier(WeaponModifier.Modifier.LIGHT_WOODS, los.lightWoods * WeaponModifier.STANDARD_MODIFIER))	
			//.addModifier(los.lightWoods, los.lightWoods + " intervening light woods");
		}
		
		if (los.heavyWoods > 0) {
			losMods.push(new WeaponModifier(WeaponModifier.Modifier.HEAVY_WOODS, los.heavyWoods * WeaponModifier.STANDARD_MODIFIER))	
			//.addModifier(los.heavyWoods * 2, los.heavyWoods + " intervening heavy woods");
		}
		
		if (los.targetCover) {
			losMods.push(new WeaponModifier(WeaponModifier.Modifier.PARTIAL_COVER, WeaponModifier.STANDARD_MODIFIER))	
			//.addModifier(1, "target has partial cover");
		}
		
		return losMods
	}
	
	/**
	 * returns the sum of the modifiers of a given Modifier object array
	 * @param mods
	 * @return
	 */
	public static def getSumModifiers(def mods){
		if(mods == null || mods.size() == 0){
			return 0
		}
		
		def sum = 0;
		for(def i=0; i<mods.size(); i++){
			def thisModifier = mods[i]
			sum += thisModifier.getValue()
		}
		
		return sum;
	}
	
	/**
	 * Modifier to attacks due to attacker terrain
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static def getAttackerTerrainModifier(Game game, Coords location) {
		Hex hex = game.getHexAt(location)
	
		def toHitMods = []
		// space screens; bonus depends on number (level)
		int screenLevel = hex.getTerrainLevel(Terrain.SCREEN)
        if (screenLevel > 0) {
            toHitMods.push(new WeaponModifier(WeaponModifier.Modifier.PARTIAL_COVER, (screenLevel + 1) * WeaponModifier.STANDARD_MODIFIER)) 
			//.addModifier(hex.terrainLevel(Terrains.SCREEN) + 1, "attacker in screen(s)");
        }
		
		return toHitMods;
	}
	
	/**
	 * Modifier to attacks due to target terrain
	 *
	 * based off of the same method from MegaMek (Compute.java)
	 */
	public static def getTargetTerrainModifier(Game game, Coords location) {
		Hex hex = game.getHexAt(location);
	
		def toHitMods = [];
		
		// TODO: you don't get terrain modifiers in midair from DFA
		/*if (entityTarget != null && entityTarget.isMakingDfa()) {
			return new ToHitData();
		}*/
		
		int waterLevel = hex.getTerrainLevel(Terrain.WATER)
		
		if (waterLevel > 0) {
			// target is in the water and not hovering
			toHitMods.push(new WeaponModifier(WeaponModifier.Modifier.TARGET_WATER, WeaponModifier.STANDARD_MODIFIER));
		}
	
		int woodsLevel = hex.getTerrainLevel(Terrain.WOODS)
		int jungleLevel = hex.getTerrainLevel(Terrain.JUNGLE)
		if(woodsLevel < jungleLevel) {
			woodsLevel = jungleLevel
		}
		
		/*if (hex.contains(Terrain.SMOKE)) {
			//TODO: toHit.addModifier(2, "target in smoke");
		}*/
		
		if(woodsLevel == 1) {
			//target in light woods
			toHitMods.push(new WeaponModifier(WeaponModifier.Modifier.LIGHT_WOODS, WeaponModifier.STANDARD_MODIFIER));
		}
		else if (woodsLevel > 1) {
			//target in heavy woods
			toHitMods.push(new WeaponModifier(WeaponModifier.Modifier.HEAVY_WOODS, woodsLevel * WeaponModifier.STANDARD_MODIFIER));
		}
		
		return toHitMods;
	}
}
