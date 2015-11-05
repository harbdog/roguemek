package roguemek.game

/**
 * Class used to define the negative effects of heat on a Unit
 *
 */
class HeatEffect {
	
	Effect effect
	Integer value
	
	private static def heatEffects
	public static final int MIN_HEAT_EFFECT = 15
	public static final int MAX_HEAT_EFFECT = 40
	
	public enum Effect {
		// modifier types that will be found in the Modifier objects
		MP_REDUCE("mp_reduce"),			// speed mp reduction (affects total AP)
		TOHIT_INCREASE("aim_reduce"),	// adds modifiers to hit
		AMMO_EXP_RISK("ammo_exp"),		// chance of ammo explosion
		SHUTDOWN_RISK("shutdown_eff"),	// chance of shutdown
		
		Effect(str) { this.str = str }
		private final String str
		public String toString() { return str }
	}
	
	public HeatEffect(Effect effect, Integer value) {
		this.effect = effect
		this.value = value
	}
	
	public static def getAllHeatEffects() {
		return heatEffects.clone()
	}
	
	/**
	 * Gets the map of all heat effects that would be afflicted at the given heat level on a Mech
	 * @param heat
	 * @return
	 */
	public static def getHeatEffectsAt(def heat) {
		def effects = [:]
		if(heat < MIN_HEAT_EFFECT) return effects
		
		for(int i = Math.floor(heat); i >= MIN_HEAT_EFFECT; i--) {
			HeatEffect thisEffect = heatEffects[i]
			if(thisEffect == null || effects.containsKey(thisEffect.effect)) {
				// Only accept the first, highest effect by type
				continue
			}
			
			effects.put(thisEffect.effect, thisEffect.value)
		}
		
		return effects
	}
	
	/**
	 * Gets the specific heat effect type at the given heat level on a Mech
	 * @param effectType
	 * @param heat
	 * @return
	 */
	public static def getHeatEffectForTypeAt(Effect effectType, def heat) {
		if(heat < MIN_HEAT_EFFECT) return null
		
		for(int i = Math.floor(heat); i >= MIN_HEAT_EFFECT; i--) {
			HeatEffect thisEffect = heatEffects[i]
			if(thisEffect != null && thisEffect.effect == effectType) {
				return thisEffect
			}
		}
		
		return null
	}
	
	/**
	 * Initialize the array of all heat effects for a Mech
	 */
	public static void initializeHeatEffects() {
		if(heatEffects != null) return
			
		heatEffects = []
		
		for(int i=MAX_HEAT_EFFECT; i>=MIN_HEAT_EFFECT; i--){
			HeatEffect effect = null;
			switch(i){
				case MAX_HEAT_EFFECT:
						effect = new HeatEffect(Effect.SHUTDOWN_RISK, 100);//SD100%
						break;
				case 38:
						effect = new HeatEffect(Effect.AMMO_EXP_RISK, 58);//AE58%, die roll 7 or higher to avoid
						break;
				case 36:
						effect = new HeatEffect(Effect.SHUTDOWN_RISK, 83);//SD83%, die roll 9 or higher to avoid
						break;
				case 35:
						effect = new HeatEffect(Effect.MP_REDUCE, 5);// -5MP
						break;
				case 34:
						effect = new HeatEffect(Effect.TOHIT_INCREASE, 4 * (int)WeaponModifier.STANDARD_MODIFIER);//+4HIT
						break;
				case 33:
						effect = new HeatEffect(Effect.AMMO_EXP_RISK, 28);//AE28%, die roll 5 or higher to avoid
						break;
				case 32:
						effect = new HeatEffect(Effect.SHUTDOWN_RISK, 58);//SD58%, die roll 7 or higher to avoid
						break;
				case 30:
						effect = new HeatEffect(Effect.MP_REDUCE, 4);// -4MP
						break;
				case 29:
						effect = new HeatEffect(Effect.AMMO_EXP_RISK, 8);// AE8%, die roll 3 or higher to avoid
						break;
				case 28:
						effect = new HeatEffect(Effect.SHUTDOWN_RISK, 28);//SD28%, die roll 5 or higher to avoid
						break;
				case 27:
						effect = new HeatEffect(Effect.TOHIT_INCREASE, 3 * (int)WeaponModifier.STANDARD_MODIFIER);//+3HIT
						break;
				case 25:
						effect = new HeatEffect(Effect.MP_REDUCE, 3);// -3MP
						break;
				case 24:
						effect = new HeatEffect(Effect.SHUTDOWN_RISK, 8);// SD8%, die roll 3 or higher to avoid
						break;
				case 23:
						effect = new HeatEffect(Effect.TOHIT_INCREASE, 2 * (int)WeaponModifier.STANDARD_MODIFIER);//+2HIT
						break;
				case 20:
						effect = new HeatEffect(Effect.MP_REDUCE, 2);//-2MP
						break;
				case 18:
						effect = new HeatEffect(Effect.TOHIT_INCREASE, 1 * (int)WeaponModifier.STANDARD_MODIFIER);//+1HIT
						break;
				case 15:
						effect = new HeatEffect(Effect.MP_REDUCE, 1);//-1MP
						break;
				default:
						break;
			}
			
			if(effect != null){
				heatEffects[i] = effect;
			}
		}
	}
}
