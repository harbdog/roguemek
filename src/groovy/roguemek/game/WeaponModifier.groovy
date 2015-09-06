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
		
		// make sure target is in the firing arc for the weapon's location
		GameService.RelativeDirection relDirection = GameService.getRelativeDirection(srcUnit, tgtUnit)
		if(relDirection == GameService.RelativeDirection.REAR){
			// only rear firing weapons are allowed to hit
			
			boolean canFlipArms = true
			boolean isArmWeapon = Mech.ARMS.contains(weapon.location)
			if(isArmWeapon){
				// check if the mech has no Lower Arm or Hand actuators in BOTH arms, as it can reverse/flip the arms to fire in rear arc
				def armCrits = srcUnit.getCritSection(weapon.location)
				
				for(thisCrit in armCrits) {
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
			}
			else if(weapon.location != Mech.RIGHT_REAR
					&& weapon.location != Mech.CENTER_REAR
					&& weapon.location != Mech.LEFT_REAR) {
				toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				return toHitMods
			}
		}
		else if(relDirection == GameService.RelativeDirection.LEFT) {
			// only left arm weapons are allowed to hit (maybe also allow left torso?)
			if(weapon.location != Mech.LEFT_ARM) {
				toHitMods.push(new WeaponModifier(Modifier.IMPOSSIBLE, AUTO_MISS))
				return toHitMods
			}
		}
		else if(relDirection == GameService.RelativeDirection.RIGHT) {
			// only right arm weapons are allowed to hit
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
		}
		
		
		// TODO: Physical attack modifiers
		/*if(weapon instanceof WeaponKick){
			// kicking has a -2 base modifier
			var kickModifier = -2;
			
			toHitMods.push(new Modifier(Modifier.KICK, kickModifier));
		}
		else if(weapon instanceof WeaponHatchet){
			// hatchets have a -1 base modifier
			var hatchetModifier = -1;
	
			toHitMods.push(new Modifier(Modifier.HATCHET, hatchetModifier));
		}*/
		
		
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
		GameService.CombatStatus srcMoveStatus = GameService.getUnitCombatStatus(game, srcUnit)
		
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
		def fromLocationMods = getToHitModifiersFromLocation(game, srcUnit.getLocation(), tgtUnit)
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
	public static def getToHitModifiersFromLocation(Game game, Coords srcLocation, BattleUnit tgtUnit){
		def toHitMods = []
		
		if(srcLocation == null || tgtUnit == null || tgtUnit.getLocation() == null){
			return toHitMods
		}
		
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
			def range = GameService.getRange(srcLocation, tgtUnit.getLocation())
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
		def los = Compute.calculateLos(game, srcLocation, tgtUnit.location)
		def losMods = Compute.losModifiers(los)
		toHitMods = (toHitMods << losMods).flatten()
		
		// add attacker terrain modifier
		def attackerMods = Compute.getAttackerTerrainModifier(game, srcLocation)
		toHitMods = (toHitMods << attackerMods).flatten()
		
		// add target terrain modifier
		def targetMods = Compute.getTargetTerrainModifier(game, tgtUnit.location)
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
				penaltyMods.add(new WeaponModifier(Modifier.HEAT, thisEffect.value * STANDARD_MODIFIER));
			}
		}
		
		//reductions for arm damage, sensor damage, etc
		//if(isMeleeWeapon()){
			// TODO: any penalties for all melee attacks go here
		//}
		// else
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
		
		// TODO: reductions for the specific weapon based on location (e.g. arm actuator hits)
		/*if(weapon.getModifier() > 0){
			penaltyMods.push(new Modifier(Modifier.CRIT, weapon.getModifier()));
		}*/
		
		return penaltyMods;
	}
}
