package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

import roguemek.game.WeaponModifier.Modifier;
import roguemek.model.*
import roguemek.mtf.MechMTF

class PilotingModifier {
	private static Log log = LogFactory.getLog(this)
	
	Modifier type
	double value
	
	public static final int AUTO_MISS = 1000
	
	// Instead of 2d6 odds, each modifier will be standardized (100/12=8.3333)
	public static final double STANDARD_MODIFIER = 8
	
	public enum Modifier {
		// modifier types that will be found in the Modifier objects
		DESTROYED("DESTROYED"),						// mech is already destroyed
		IMMOBILE("IMMOBILE"),						// automatically falls
		MECH_STANDING("STANDING"),					// +0 for attempting to stand
		MECH_RUNNING("RUNNING"),					// +0 for running with damaged hip/gyro
		MECH_JUMPING("JUMPING"),					// +0 for jumping with destroyed leg or damaged hip/gyro/leg/foot/hip actuators
		
		MECH_DAMAGE("DAMAGE 20+"),					// +1 for taking 20+ damage in one turn
		MECH_SHUTDOWN("SHUTDOWN"),					// +3 for engine shutdown
		
		UP_LEG_ACTUATOR_DESTROYED("UP LEG ACT DESTROYED"),	// +1 for upper leg actuator destroyed
		LOW_LEG_ACTUATOR_DESTROYED("LOW LEG ACT DESTROYED"),// +1 for lower leg actuator destroyed
		FT_ACTUATOR_DESTROYED("FT ACT DESTROYED"),	// +1 for foot actuator destroyed
		HIP_DESTROYED("HIP DESTROYED"),				// +2 for hip actuator destroyed
		LEG_DESTROYED("LEG DESTROYED"),				// automatically falls or +5 for previously destroyed
		
		GYRO_HIT("GYRO HIT"),						// +3 for gyro hit
		GYRO_DESTROYED("GYRO DESTROYED"),			// automatically falls
		
		MECH_KICKED("MECH KICKED"),					// +0 for being kicked
		MECH_MISSED_KICK("MISSED KICK"),			// +0 for missing a kick
		MECH_PUSHED("MECH PUSHED"),					// +0 for being pushed
		
		MECH_CHARGED("MECH CHARGED"),				// +2 for being charged
		MECH_CHARGE("MECH CHARGE"),					// +2 for successful charge
		
		MECH_DFAD("MECH DFA'D"),					// +2 for being hit by death from above
		MECH_DFA("MECH DFA"),						// +4 for successful DFA
		MECH_MISSED_DFA("MISSED DFA"),				// automatically falls
		
		MECH_WATER_1("ENTER DEPTH 1"),				// -1 for entering depth 1 water
		MECH_WATER_2("ENTER DEPTH 2"),				// 0 for entering depth 2 water
		MECH_WATER_3("ENTER DEPTH 3+")				// +1 for entering depth 3+ water
		
		Modifier(str) { this.str = str }
		private final String str
		public String toString() { return str }
	}
	
	public PilotingModifier(Modifier type, double value) {
		this.type = type
		this.value = value
	}
	
	/**
	 * Returns objects describing each modifier to hit the target from the source with the given weapon
	 */
	public static def getPilotSkillModifiers(Game game, BattleUnit unit, Modifier causeModifier) {
		def toHitMods = []
		
		if(unit.isDestroyed()) {
			// A destroyed unit will fall automatically if it isn't already down
			addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.DESTROYED, AUTO_MISS))
			return toHitMods
		}
		
		if(causeModifier != null) {
			// optional additional modifier based on the cause of the pilot skill roll to be added
			if(Modifier.MECH_WATER_1 == causeModifier) {
				// all of the -1 cause modifiers
				addModifierIfUnique(toHitMods, new PilotingModifier(causeModifier, -1 * STANDARD_MODIFIER))
			}
			else if(Modifier.MECH_STANDING == causeModifier
					|| Modifier.MECH_RUNNING == causeModifier
					|| Modifier.MECH_JUMPING == causeModifier
					|| Modifier.MECH_PUSHED == causeModifier
					|| Modifier.MECH_KICKED == causeModifier
					|| Modifier.MECH_MISSED_KICK == causeModifier
					|| Modifier.MECH_WATER_2 == causeModifier) {
				// any +0 modifiers that could be needed for conditional checking
				addModifierIfUnique(toHitMods, new PilotingModifier(causeModifier, 0))
			}
			else if(Modifier.MECH_DAMAGE == causeModifier
					|| Modifier.UP_LEG_ACTUATOR_DESTROYED == causeModifier
					|| Modifier.LOW_LEG_ACTUATOR_DESTROYED == causeModifier
					|| Modifier.FT_ACTUATOR_DESTROYED == causeModifier
					|| Modifier.MECH_WATER_3 == causeModifier) {
				// all of the +1 cause modifiers
				addModifierIfUnique(toHitMods, new PilotingModifier(causeModifier, 1 * STANDARD_MODIFIER))
			}
			else if(Modifier.HIP_DESTROYED == causeModifier
					|| Modifier.MECH_CHARGED == causeModifier
					|| Modifier.MECH_DFAD == causeModifier
					|| Modifier.MECH_CHARGE == causeModifier) {
				// all of the +2 cause modifiers
				addModifierIfUnique(toHitMods, new PilotingModifier(causeModifier, 2 * STANDARD_MODIFIER))
			}
			else if(Modifier.GYRO_HIT == causeModifier) {
				// all of the +3 cause modifiers
				addModifierIfUnique(toHitMods, new PilotingModifier(causeModifier, 3 * STANDARD_MODIFIER))
			}
			else if(Modifier.MECH_DFA == causeModifier) {
				// all of the +4 cause modifiers
				addModifierIfUnique(toHitMods, new PilotingModifier(causeModifier, 4 * STANDARD_MODIFIER))
			}
			else if(Modifier.GYRO_DESTROYED == causeModifier
					|| Modifier.LEG_DESTROYED == causeModifier
					|| Modifier.MECH_MISSED_DFA == causeModifier) {
				// all of the automatic falls
				addModifierIfUnique(toHitMods, new PilotingModifier(causeModifier, AUTO_MISS))
			}
			else {
				log.info("Unspecified causeModifier: "+causeModifier)
			}
		}
		
		// TODO: Handle immobile status in piloting skill modifier
		
		if(unit.shutdown) {
			addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.MECH_SHUTDOWN, 3 * STANDARD_MODIFIER))
		}
		
		if(unit instanceof BattleMech) {
			// check gyro hits in CT
			def centerTorso = unit.getCritSection(Mech.CENTER_TORSO)
			for(BattleEquipment thisCrit in centerTorso) {
				if(thisCrit == null || thisCrit.isActive()) {
					continue
				}
				
				if(MechMTF.MTF_CRIT_GYRO == thisCrit.getName()) {
					if(thisCrit.isDestroyed()) {
						addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.GYRO_DESTROYED, AUTO_MISS))
					}
					else {
						addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.GYRO_HIT, 3 * STANDARD_MODIFIER))
					}
				}
			}
			
			// check for each destroyed leg or actuator hits in leg
			for(def legIndex in Mech.LEGS) {
				if(unit.internals[legIndex] == 0) {
					addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.LEG_DESTROYED, 5 * STANDARD_MODIFIER))
				}
				else{
					// count actuator and hip hits in legs
					def legCrits = unit.getCritSection(legIndex)
					
					for(BattleEquipment thisCrit in legCrits) {
						if(thisCrit == null || thisCrit.isActive()) {
							continue
						}
						
						if(MechMTF.MTF_CRIT_HIP == thisCrit.getName()) {
							addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.HIP_DESTROYED, 2 * STANDARD_MODIFIER))
						}
						else if(MechMTF.MTF_CRIT_UP_LEG_ACT == thisCrit.getName()) {
							addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.UP_LEG_ACTUATOR_DESTROYED, 1 * STANDARD_MODIFIER))
						}
						else if(MechMTF.MTF_CRIT_LOW_LEG_ACT == thisCrit.getName()) {
							addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.LOW_LEG_ACTUATOR_DESTROYED, 1 * STANDARD_MODIFIER))
						}
						else if(MechMTF.MTF_CRIT_FOOT_ACT == thisCrit.getName()) {
							addModifierIfUnique(toHitMods, new PilotingModifier(Modifier.FT_ACTUATOR_DESTROYED, 1 * STANDARD_MODIFIER))
						}
					}
				}
			}
		}
		
		return toHitMods
	}
	
	/**
	 * Adds modifier to the list only if that modifier type has not already been added to the list
	 * @param modsList
	 * @param modifier
	 */
	private static void addModifierIfUnique(def modsList, PilotingModifier modifier) {
		for(PilotingModifier mod in modsList) {
			if(mod.type.equals(modifier.type)) {
				return
			}
		}
		
		modsList.push(modifier)
	}
	
	@Override
	public String toString() {
		return "<PilotingModifier:"+this.type+"="+this.value+">"
	}
}
