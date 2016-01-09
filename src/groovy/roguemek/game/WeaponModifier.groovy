package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

import roguemek.model.*
import roguemek.mtf.MechMTF

/**
 * Class used to define the modifiers on a weapon to hit a target
 *
 */
class WeaponModifier {
	private static Log log = LogFactory.getLog(this)
	
	Modifier type
	double value
	
	public static final int AUTO_MISS = 1000
	
	// Instead of 2d6 odds, each modifier will be standardized (100/12=8.3333)
	public static final double STANDARD_MODIFIER = 8
	
	public enum Modifier {
		// modifier types that will be found in the Modifier objects
		IMPOSSIBLE("IMPOSSIBLE"),
		MIN_RANGE("MIN RNG"),
		SHORT_RANGE("SHORT RNG"),
		MEDIUM_RANGE("MEDIUM RNG"),
		LONG_RANGE("LONG RNG"),
		MAX_RANGE("MAX RNG"),
		KICK("KICK"),
		HATCHET("HATCHET"),
		HEAT("HEAT"),
		CRIT("CRIT"),
		WALKING("WALKING"),
		RUNNING("RUNNING"),
		JUMPING("JUMPING"),
		WATER("WATER"),
		TARGET_WATER("TGT WATER"),
		TARGET_IMMOBILE("TGT IMMOBILE"),
		TARGET_PRONE("TGT PRONE"),
		TARGET_JUMPING("TGT JUMPING"),
		TARGET_MOVING("TGT MOVING"),
		LIGHT_WOODS("LT WOODS"),
		HEAVY_WOODS("HVY WOODS"),
		PARTIAL_COVER("PART COVER"),
		
		Modifier(str) { this.str = str }
		private final String str
		public String toString() { return str }
	}
	
	public WeaponModifier(Modifier type, double value) {
		this.type = type
		this.value = value
	}
	
	/**
	 * Returns objects describing each modifier to hit the target from the source with the given weapon
	 */
	public static def getToHitModifiers(Game game, BattleUnit srcUnit, BattleWeapon weapon, BattleUnit tgtUnit) {
		def toHitMods = []
		
		if(srcUnit.shutdown) {
			// A shutdown unit cannot hit with any weapon
			toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
			return toHitMods
		}
		else if(tgtUnit.isDestroyed()) {
			// A destroyed unit doesn't need to take additional damage?
			toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
			return toHitMods
		}
		
		// make sure target is in the firing arc for the weapon's location
		GameService.RelativeDirection relDirection = GameService.getRelativeDirection(srcUnit, tgtUnit)
		if(relDirection == GameService.RelativeDirection.REAR){
			// only rear firing weapons are allowed to hit
			
			boolean canFlipArms = true
			boolean isArmWeapon = Mech.ARMS.contains(weapon.location)
			if(isArmWeapon){
				// check if the mech has no Lower Arm or Hand actuators in BOTH arms, as it can reverse/flip the arms to fire in rear arc
				def armCrits = srcUnit.getCritSection(weapon.location)
				
				for(BattleEquipment thisCrit in armCrits) {
					if(MechMTF.MTF_CRIT_LOW_ARM_ACT == thisCrit.getName()
							|| MechMTF.MTF_CRIT_HAND_ACT == thisCrit.getName()){
						// actuator found, flipping arms not possible
						canFlipArms = false;
						break;
					}
				}
			}
			
			if(isArmWeapon && canFlipArms) {
				// allow flippable arms to fire in rear arc
				// TODO: Total Warfare (pg. 106) does not mention if flipping the arm is not possible when shoulder or upper arm actuator are destroyed?
			}
			else if(weapon.location != Mech.RIGHT_REAR
					&& weapon.location != Mech.CENTER_REAR
					&& weapon.location != Mech.LEFT_REAR) {
				toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				return toHitMods
			}
		}
		else if(relDirection == GameService.RelativeDirection.LEFT) {
			// only left arm weapons are allowed to hit (excluding punching, for now)
			if(weapon.location != Mech.LEFT_ARM) {
				toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				return toHitMods
			}
		}
		else if(relDirection == GameService.RelativeDirection.RIGHT) {
			// only right arm weapons are allowed to hit (excluding punching, for now)
			if(weapon.location != Mech.RIGHT_ARM) {
				toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				return toHitMods
			}
		}
		else {
			// any weapon can hit not located in a rear torso
			if(weapon.location == Mech.RIGHT_REAR
					|| weapon.location == Mech.CENTER_REAR
					|| weapon.location == Mech.LEFT_REAR) {
				toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				return toHitMods
			}
		}
		
		int range = GameService.getRange(srcUnit.getLocation(), tgtUnit.getLocation())
		
		int rangeModifier = -1
		def weaponRanges = weapon.getRanges()
		
		for(int i=0; i<weaponRanges.length; i++){
			int thisWpnRange = weaponRanges[i]
			
			if(range <= thisWpnRange){
				rangeModifier = (i * 2 * STANDARD_MODIFIER)
				
				Modifier rangeType = null
				if(i==0){
					rangeType = Modifier.SHORT_RANGE
				}
				else if(i==1){
					rangeType = Modifier.MEDIUM_RANGE
				}
				else{
					rangeType = Modifier.LONG_RANGE
				}
				
				toHitMods.push(new WeaponModifier(rangeType, rangeModifier))
				
				break
			}
		}
		
		if(rangeModifier == -1){
			// TODO: weapon is outside of long range, use maximum range rules? For now just return as auto miss
			toHitMods.push(new WeaponModifier(Modifier.MAX_RANGE, AUTO_MISS))
			return toHitMods
		}
		
		GameService.CombatStatus srcMoveStatus = GameService.getUnitCombatStatus(game, srcUnit)
		
		if(weapon.isPhysical()){
			Coords srcLocation = srcUnit.getLocation()
			Coords tgtLocation = tgtUnit.getLocation()
			
			def srcHex = game.getHexAt(srcLocation)
			def tgtHex = game.getHexAt(tgtLocation)
			def elevationDiff = srcHex.elevation - tgtHex.elevation
			
			// Physical attack modifiers
			if(weapon.isKick()){
				if(Math.abs(elevationDiff) > 1) {
					// melee attacks can not hit mechs at more than 1 elevation difference
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				else if(elevationDiff == -1) {
					// kicks can not hit mechs at a higher elevation
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				
				// kicking has a -2 base modifier
				def kickModifier = -2 * STANDARD_MODIFIER;
				
				toHitMods.push(new WeaponModifier(Modifier.KICK, kickModifier));
			}
			else if(weapon.isPunch()) {
				if(Math.abs(elevationDiff) > 1) {
					// melee attacks can not hit mechs at more than 1 elevation difference
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				else if(elevationDiff == 1) {
					// punches can not hit mechs at a lower elevation
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
			}
			else if(weapon.isHatchet()){
				if(Math.abs(elevationDiff) > 1) {
					// melee attacks can not hit mechs at more than 1 elevation difference
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				
				// hatchets require a functioning hand actuator in its carrying arm
				def armCrits = srcUnit.getCritSection(weapon.location)
				for(BattleEquipment thisCrit in armCrits) {
					if(MechMTF.MTF_CRIT_HAND_ACT == thisCrit.getName()
							&& !thisCrit.isActive()){ 
						toHitMods.push(new WeaponModifier(Modifier.CRIT, AUTO_MISS))
						return toHitMods
					}
				}
				
				// hatchets have a -1 base modifier
				def hatchetModifier = -1 * STANDARD_MODIFIER;
		
				toHitMods.push(new WeaponModifier(Modifier.HATCHET, hatchetModifier));
			}
			else if(weapon.isCharge()){
				Coords forwardCoords = GameService.getForwardCoords(game, srcLocation, srcUnit.heading)
				if(!forwardCoords.equals(tgtLocation)) {
					// A mech being Charged must be directly in front of the attacker
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				
				if(srcMoveStatus == GameService.CombatStatus.UNIT_JUMPING){
					// the unit can not already be jumping this turn
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				
				// A charging mech must have enough AP to enter the target's hex
				int apRequired = GameService.getHexRequiredAP(game, srcLocation, tgtLocation)
				if(apRequired > srcUnit.apRemaining) {
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				
				// TODO: Charging has a base modifier of the difference between the piloting skill of the target and source
			}
			else if(weapon.isDFA()){
				Coords forwardCoords = GameService.getForwardCoords(game, srcLocation, srcUnit.heading)
				if(!forwardCoords.equals(tgtLocation)) {
					// A mech being DFA'd must be directly in front of the attacker
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				
				if(srcMoveStatus != GameService.CombatStatus.UNIT_JUMPING){
					// the unit must already be jumping to DFA
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
				
				// A mech performing DFA must have enough AP and JP to enter the target's hex
				int apRequired = 1
				int jpRequired = GameService.getHexRequiredJP(game, srcLocation, tgtLocation)
				if(apRequired > srcUnit.apRemaining
						|| jpRequired > srcUnit.jpRemaining) {
					toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
					return toHitMods
				}
						
				// TODO: DFA has a base modifier of the difference between the piloting skill of the target and source
				// TODO: DFA also has a +3 to-hit against infantry
			}
		}
		
		int minRange = weapon.getMinRange()
		if(minRange != null && minRange > 0 && range <= minRange){
			// add in minimum range modifier
			int minRangeModifier = STANDARD_MODIFIER * ((minRange - range) + 1)
			
			toHitMods.push(new WeaponModifier(Modifier.MIN_RANGE, minRangeModifier))
		}
		
		// add in heat and other crit effect modifiers
		def penaltyModifiers = getToHitEffectPenalties(game, srcUnit, weapon);
		toHitMods = (toHitMods << penaltyModifiers).flatten()
		
		// add movement modifiers from source
		if(srcMoveStatus == GameService.CombatStatus.UNIT_STANDING){
			// no source modifier for standing
		}
		else if(srcMoveStatus == GameService.CombatStatus.UNIT_WALKING){
			int srcMoveModifier = STANDARD_MODIFIER
			
			toHitMods.push(new WeaponModifier(Modifier.WALKING, srcMoveModifier))
		}
		else if(srcMoveStatus == GameService.CombatStatus.UNIT_RUNNING){
			int srcMoveModifier = 2 * STANDARD_MODIFIER
			
			toHitMods.push(new WeaponModifier(Modifier.RUNNING, srcMoveModifier))
		}
		else if(srcMoveStatus == GameService.CombatStatus.UNIT_JUMPING){
			int srcMoveModifier = 3 * STANDARD_MODIFIER
			
			toHitMods.push(new WeaponModifier(Modifier.JUMPING, srcMoveModifier))
		}
		
		// add in location and target only type mods
		// TODO: share applicable modifiers with other weapons firing from the same mech (only calculate once)
		def fromLocationMods = getToHitModifiersFromLocation(game, srcUnit, tgtUnit)
		toHitMods = (toHitMods << fromLocationMods).flatten()
		
		//log.info("Modifiers for "+weapon.toString()+" from "+srcUnit.toString() + " at "+tgtUnit.toString())
		//for(WeaponModifier modifier in toHitMods) {
			//log.info("  "+modifier.type+": "+modifier.value)
		//}
		
		return toHitMods
	}
	
	/**
	 * returns only the los modifiers and target movement modifiers from the location
	 * @param srcLocation
	 * @param tgtUnit
	 */
	public static def getToHitModifiersFromLocation(Game game, BattleUnit srcUnit, BattleUnit tgtUnit){
		def toHitMods = []
		
		if(srcUnit == null || srcUnit.getLocation() == null 
				|| tgtUnit == null || tgtUnit.getLocation() == null){
			return toHitMods
		}
				
		Coords srcLocation = srcUnit.getLocation()
		Coords tgtLocation = tgtUnit.getLocation()
		
		// add movement modifiers from target
		GameService.CombatStatus tgtMoveStatus = GameService.getUnitCombatStatus(game, tgtUnit)
		def tgtSpeed = tgtUnit.hexesMoved
		
		if(tgtMoveStatus == GameService.CombatStatus.UNIT_STANDING){
			// no target modifier for standing
		}
		else if(tgtMoveStatus == GameService.CombatStatus.UNIT_IMMOBILE){
			// immobile mech decreases to hit roll by 4
			toHitMods.push(new WeaponModifier(Modifier.TARGET_IMMOBILE, -4 * STANDARD_MODIFIER))
		}
		else if(tgtMoveStatus == GameService.CombatStatus.UNIT_PRONE){
			// prone mech decreases to hit roll by 2 from adjacent hex (distance of 1), but increases by 1 from all others
			def range = GameService.getRange(srcLocation, tgtLocation)
			if(range <= 1){
				toHitMods.push(new WeaponModifier(Modifier.TARGET_PRONE, -2 * STANDARD_MODIFIER))
			}
			else{
				toHitMods.push(new WeaponModifier(Modifier.TARGET_PRONE, STANDARD_MODIFIER))
			}
		}
		else if(tgtMoveStatus == GameService.CombatStatus.UNIT_JUMPING){
			// +1 will be added for each hex jumped since AP movement is less per turn than standard BT
			// and then + 1 additional from the act of jumping
			toHitMods.push(new WeaponModifier(Modifier.TARGET_JUMPING, (tgtSpeed + 1) * STANDARD_MODIFIER))
		}
		else if(tgtSpeed > 0){
			// +1 will be added for each hex moved since AP movement is less per turn than standard BT
			toHitMods.push(new WeaponModifier(Modifier.TARGET_MOVING, tgtSpeed * STANDARD_MODIFIER))
		}
		
		
		// add LOS obstacle modifiers
		def los = Compute.calculateLos(game, srcUnit, tgtUnit)
		def losMods = Compute.losModifiers(los)
		toHitMods = (toHitMods << losMods).flatten()
		
		// add attacker terrain modifier
		def attackerMods = Compute.getAttackerTerrainModifier(game, srcLocation)
		toHitMods = (toHitMods << attackerMods).flatten()
		
		// add target terrain modifier
		def targetMods = Compute.getTargetTerrainModifier(game, tgtLocation)
		toHitMods = (toHitMods << targetMods).flatten()
		
		return toHitMods;
	}
	
	/**
	 * returns the toHit penalties incurred by the mech due to heat effects, arm/sensor damage, etc
	 * @param mech
	 * @param weapon
	 * @return
	 */
	public static def getToHitEffectPenalties(Game game, BattleUnit unit, BattleWeapon weapon){
		def penaltyMods = [];
		if(unit.heat >= HeatEffect.MIN_HEAT_EFFECT) {
			HeatEffect thisEffect = HeatEffect.getHeatEffectForTypeAt(HeatEffect.Effect.TOHIT_INCREASE, unit.heat)
			if(thisEffect != null) {
				penaltyMods.add(new WeaponModifier(Modifier.HEAT, thisEffect.value));
			}
		}
		
		if(unit instanceof BattleMech) {
			// any penalties for all weapon attacks go here
			
			def headCrits = unit.getCritSection(Mech.HEAD);
			for(BattleEquipment thisCrit in headCrits){
				if(thisCrit != null
						&& MechMTF.MTF_CRIT_SENSORS == thisCrit.getName()
						&& !thisCrit.isActive()) {
					// +2 HIT for weapons when Sensors are destroyed
					penaltyMods.add(new WeaponModifier(Modifier.CRIT, 2 * STANDARD_MODIFIER));
				}
			}
		}
		
		if(weapon.isPhysical()
				&& unit instanceof BattleMech) {
			// any penalties for melee attacks go here
			if(weapon.isPunch()) {
				// determine best arm to punch with
				def bestArmModifiers = -1
				
				for(def location in Mech.ARMS) {
					def locationCrits = unit.getCritSection(location)
					
					def numArmModifiers = 0
					
					// count active arm actuators/shoulder
					def numShoulders = 0
					def numArmActuators = 0
					def numHandActuators = 0
					
					for(BattleEquipment thisCrit in locationCrits) {
						if(thisCrit != null && thisCrit.isActive()) {
							if(MechMTF.MTF_CRIT_SHOULDER == thisCrit.getName()) {
								numShoulders ++
							}
							else if(MechMTF.MTF_CRIT_UP_ARM_ACT == thisCrit.getName()
									|| MechMTF.MTF_CRIT_LOW_ARM_ACT == thisCrit.getName()) {
								numArmActuators ++ 
							}
							else if(MechMTF.MTF_CRIT_HAND_ACT == thisCrit.getName()) {
								numHandActuators ++
							}
						}
					}
					
					if(numShoulders < 1) {
						// punch cannot hit without active shoulder
						numArmModifiers = -1
					}
					else if(numArmActuators < 2) {
						// punching gets +2 for each missing arm actuator
						numArmModifiers = 2 * (2 - numArmActuators)
					}
					else if(numHandActuators == 0) {
						// or, punching gets +1 for missing hand actuator 
						numArmModifiers = 1
					}
					
					if(numArmModifiers >= 0 && 
							(bestArmModifiers == -1 || numArmModifiers < bestArmModifiers)){
						// only take the best arm hit scenario
						bestArmModifiers = numArmModifiers
					}
				}
				
				if(bestArmModifiers == -1) {
					penaltyMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				}
				else if(bestArmModifiers > 0) {
					penaltyMods.add(new WeaponModifier(Modifier.CRIT, bestArmModifiers * STANDARD_MODIFIER));
				}
			}
			else if(weapon.isKick()) {
				// determine best leg to kick with
				def bestLegModifiers = -1
				
				def numHips = 0
				
				for(def location in Mech.LEGS) {
					def locationCrits = unit.getCritSection(location)
					
					def numLegModifiers = 0
					
					// count active leg actuators
					def numLegActuators = 0
					def numFootActuators = 0
					
					for(BattleEquipment thisCrit in locationCrits) {
						if(thisCrit != null && thisCrit.isActive()) {
							if(MechMTF.MTF_CRIT_HIP == thisCrit.getName()) {
								numHips ++
							}
							else if(MechMTF.MTF_CRIT_UP_LEG_ACT == thisCrit.getName()
									|| MechMTF.MTF_CRIT_LOW_LEG_ACT == thisCrit.getName()) {
								numLegActuators ++
							}
							else if(MechMTF.MTF_CRIT_FOOT_ACT == thisCrit.getName()) {
								numFootActuators ++
							}
						}
					}
					
					if(numLegActuators < 2) {
						// kicking gets +2 for each missing leg actuator
						numLegModifiers = 2 * (2 - numLegActuators)
					}
					else if(numFootActuators == 0) {
						// or, kicking gets +1 for missing foot actuator
						numLegModifiers = 1
					}
					
					if(numLegModifiers >= 0 &&
							(bestLegModifiers == -1 || numLegModifiers < bestLegModifiers)){
						// only take the best leg hit scenario
						bestLegModifiers = numLegModifiers
					}
				}
				
				if(numHips < 2) {
					// kick cannot hit without 2 active hips
					bestLegModifiers = -1
				}
				
				if(bestLegModifiers == -1) {
					penaltyMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				}
				else if(bestLegModifiers > 0) {
					penaltyMods.add(new WeaponModifier(Modifier.CRIT, bestLegModifiers * STANDARD_MODIFIER));
				}
			}
		}
		else {
			// reductions for the weapon based on location (e.g. arm actuator hits)
			def location = weapon.getLocation()
			
			if(unit instanceof BattleMech) {
				if(location == Mech.LEFT_ARM
						|| location == Mech.RIGHT_ARM) {
					// check for shoulder and arm actuator hits
					def locationCrits = unit.getCritSection(location)
					
					def numActuatorHits = 0
					for(BattleEquipment thisCrit in locationCrits) {
						if(thisCrit != null && !thisCrit.isActive()) {
							if(MechMTF.MTF_CRIT_SHOULDER == thisCrit.getName()) {
								// shoulder hit gives +4 for weapons in arm, disregards any other damaged actuators
								numActuatorHits = 4	
								break
							}
							else if(MechMTF.MTF_CRIT_UP_ARM_ACT == thisCrit.getName()
									|| MechMTF.MTF_CRIT_LOW_ARM_ACT == thisCrit.getName()) {
								// each arm actuator hit gives +1 for weapons in arm
								numActuatorHits ++
							}
						}
					}
					
					if(numActuatorHits > 0) {
						penaltyMods.add(new WeaponModifier(Modifier.CRIT, numActuatorHits * STANDARD_MODIFIER));
					}
				}
			}
		}
		
		return penaltyMods;
	}
	
	@Override
	public String toString() {
		return "<WeaponModifier:"+this.type+"="+this.value+">"
	}
}
