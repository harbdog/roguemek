package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

import roguemek.game.WeaponModifier.Modifier;
import roguemek.model.*
import roguemek.mtf.MechMTF

class PilotingModifier {
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
		
		MECH_DAMAGE("DAMAGE"),						// +1 for taking 20+ damage in one turn
		MECH_SHUTDOWN("SHUTDOWN"),					// +3 for engine shutdown
		
		LEG_ACTUATOR_DESTROYED("LEG ACT DESTROYED"),// +1 for leg/foot actuator destroyed
		FT_ACTUATOR_DESTROYED("FT ACT DESTROYED"),	// +1 for leg/foot actuator destroyed
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
	public static def getPilotSkillModifiers(Game game, BattleUnit unit) {
		def toHitMods = []
		
		if(unit.isDestroyed()) {
			// A destroyed unit will fall automatically if it isn't already down
			toHitMods.push(new PilotingModifier(Modifier.DESTROYED, AUTO_MISS))
			return toHitMods
		}
		
		if(unit.shutdown) {
			toHitMods.push(new PilotingModifier(Modifier.MECH_SHUTDOWN, 3 * STANDARD_MODIFIER))
		}
		
		def numGyroHits = 0
		
		// TODO: count gyro hits in CT
		
		// TODO: check for a destroyed leg
		
		// TODO: count actuator and hip hits in legs
		
		return toHitMods
	}
	
	@Override
	public String toString() {
		return "<PilotingModifier:"+this.type+"="+this.value+">"
	}
}
