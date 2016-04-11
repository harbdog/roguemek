package roguemek.model

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

import roguemek.mtf.*
import roguemek.assets.ContextHelper

/**
 * Represents the stock or core Mech configuration
 */
class Mech extends Unit {
	private static Log log = LogFactory.getLog(this)
	
	static searchable = {
		only = ['name', 'description', 'chassis', 'variant']
	}
	
	// Configuration properties
	String chassis
	String variant
	
	Integer[] armor
	Integer[] internals
	
	List crits
	static hasMany = [crits: long]
	
	Integer engineRating
	String engineType
	
	Integer walkMP
	Integer jumpMP
	
	public static int NUM_CRITS = 78
	static constraints = {
		chassis blank: false
		variant blank: false
		
		mass range : 20..100, validator:{val, obj ->
			if(val % 5 != 0) {
				return false;
			}
		}
		
		armor size: 11..11
		internals size: 8..8
		
		crits size: NUM_CRITS..NUM_CRITS
		
		engineRating min: 10
		engineType blank: false
		
		walkMP min: 1
		jumpMP min: 0
	}
	
	def mechService
	
	// static location indices
	public static final HEAD = 0;
	public static final LEFT_ARM = 1;
	public static final LEFT_TORSO = 2;
	public static final CENTER_TORSO = 3;
	public static final RIGHT_TORSO = 4;
	public static final RIGHT_ARM = 5;
	public static final LEFT_LEG = 6;
	public static final RIGHT_LEG = 7;
	public static final LEFT_REAR = 8;
	public static final CENTER_REAR = 9;
	public static final RIGHT_REAR = 10;
	
	public static final LEGS = [LEFT_LEG, RIGHT_LEG];
	public static final ARMS = [LEFT_ARM, RIGHT_ARM];
	public static final TORSOS = [LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO]
	
	// hit locations based on rolls in the order 2,3,4,5,6,7,8,9,10,11,12
	public static final FRONT_HIT_LOCATIONS	= [CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];
	public static final LEFT_HIT_LOCATIONS  = [LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, LEFT_LEG, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, RIGHT_LEG, HEAD];
	public static final RIGHT_HIT_LOCATIONS	= [RIGHT_TORSO, RIGHT_LEG, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_ARM, LEFT_LEG, HEAD];
	public static final REAR_HIT_LOCATIONS	= [CENTER_REAR, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_REAR, CENTER_REAR, LEFT_REAR, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];
	
	// melee hit locations based on rolls 1,2,3,4,5,6
	public static final FRONT_PUNCH_LOCATIONS = [LEFT_ARM, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, HEAD];
	public static final LEFT_PUNCH_LOCATIONS  = [LEFT_TORSO, LEFT_TORSO, CENTER_TORSO, LEFT_ARM, LEFT_ARM, HEAD];
	public static final RIGHT_PUNCH_LOCATIONS = [RIGHT_TORSO, RIGHT_TORSO, CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, HEAD];
	public static final REAR_PUNCH_LOCATIONS  = [LEFT_ARM, LEFT_REAR, CENTER_REAR, RIGHT_REAR, RIGHT_ARM, HEAD];
	
	public static final FRONT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
	public static final LEFT_KICK_LOCATIONS  = [LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
	public static final RIGHT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG];
	public static final REAR_KICK_LOCATIONS  = FRONT_KICK_LOCATIONS;
	
	public static final ALL_LOCATIONS = [HEAD, LEFT_ARM, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, 
										 LEFT_LEG, RIGHT_LEG, LEFT_REAR, CENTER_REAR, RIGHT_REAR]
	
	public static final CRIT_LOCATIONS = [HEAD, LEFT_ARM, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, LEFT_LEG, RIGHT_LEG]
	
	public static final AMMO_CONSUME_LOCATIONS = [HEAD, CENTER_TORSO, LEFT_TORSO, RIGHT_TORSO, LEFT_ARM, RIGHT_ARM, LEFT_LEG, RIGHT_LEG]
	
	// internal structure points for each tonnage
	public static final INTERNAL_STRUCTURE = [
		//	T:		[HD,LA,LT,CT,RT,RA,LL,RL]
			20:		[ 3, 3, 5, 6, 5, 3, 4, 4],
			25:		[ 3, 4, 6, 8, 6, 4, 6, 6],
			30:		[ 3, 5, 7,10, 7, 5, 7, 7],
			35:		[ 3, 6, 8,11, 8, 6, 8, 8],
			40:		[ 3, 6,10,12,10, 6,10,10],
			45:		[ 3, 7,11,14,11, 7,11,11],
			50:		[ 3, 8,12,16,12, 8,12,12],
			55:		[ 3, 9,13,18,13, 9,13,13],
			60:		[ 3,10,14,20,14,10,14,14],
			65:		[ 3,10,15,21,15,10,15,15],
			70:		[ 3,11,15,22,15,11,15,15],
			75:		[ 3,12,16,23,16,12,16,16],
			80:		[ 3,13,17,25,17,13,17,17],
			85:		[ 3,14,18,27,18,14,18,18],
			90:		[ 3,15,19,29,19,15,19,19],
			95:		[ 3,16,20,30,20,16,20,20],
			100:	[ 3,17,21,31,21,17,21,21],]
	
	public static final MAX_ARMOR = [
		//	T:		MAX
			20:		69,
			25:		89,
			30:		105,
			35:		119,
			40:		137,
			45:		153,
			50:		169,
			55:		185,
			60:		201,
			65:		211,
			70:		217,
			75:		231,
			80:		247,
			85:		263,
			90:		279,
			95:		293,
			100:	307,]
	
	// Mech weight class types
	public static final LIGHT = "light"
	public static final MEDIUM = "medium"
	public static final HEAVY = "heavy"
	public static final ASSAULT = "assault"

	static void init() {
		Set<String> mechPaths = ContextHelper.getResourcePaths("/src/mtf/mechs/")
		
		for(String path in mechPaths) {
			if(path.toLowerCase().endsWith(MechMTF.MTF_EXTENSION)) {
				InputStream mtfFile = ContextHelper.getResource(path)
				if(mtfFile.available()) {
					MechMTF.createMechFromMTF(mtfFile)
				}
			}
		}
	}
	
	/**
	 * returns shortened text of the hit location index
	 * @param index
	 * @return
	 */
	public static String getLocationText(index){
		String locText = "";
		switch(index){
			case HEAD:
				locText = "HD";
				break;
			case LEFT_ARM:
				locText = "LA";
				break;
			case LEFT_TORSO:
				locText = "LT";
				break;
			case CENTER_TORSO:
				locText = "CT";
				break;
			case RIGHT_TORSO:
				locText = "RT";
				break;
			case RIGHT_ARM:
				locText = "RA";
				break;
			case LEFT_LEG:
				locText = "LL";
				break;
			case RIGHT_LEG:
				locText = "RL";
				break;
			case LEFT_REAR:
				locText = "LTR";
				break;
			case CENTER_REAR:
				locText = "CTR";
				break;
			case RIGHT_REAR:
				locText = "RTR";
				break;
		}
		return locText;
	}
	
	/**
	 * Gets the start index of the crits array for the given section
	 * @param critSectionIndex
	 * @return
	 */
	public static int getCritSectionStart(int critSectionIndex) {
		switch(critSectionIndex) {
			case HEAD:
				// the HEAD only has 6 instead of the normal 12 crits
				return 0
				break
			
			case LEFT_ARM:
			case LEFT_TORSO:
			case CENTER_TORSO:
			case RIGHT_TORSO:
			case RIGHT_ARM:
				// account for skipping over the HEAD which only has 6
				return (critSectionIndex * 12) - 6		//-(HEAD)
				break
				
			case LEFT_LEG:
				// the LEGS only have 6 instead of the normal 12 crits
				return (critSectionIndex * 12) - 6		//-(HEAD)
				break
			case RIGHT_LEG:
				// the LEGS only have 6 instead of the normal 12 crits
				return (critSectionIndex * 12) - 6 - 6	//-(HEAD) -(LEFT_LEG)
				break
				
			default: 
				return -1 
				break
		}
		
		return -1
	}
	
	/**
	 * Gets the end index of the crits array for the given section
	 * @param critSectionIndex
	 * @return
	 */
	public static int getCritSectionEnd(int critSectionIndex) {
		switch(critSectionIndex) {
			case HEAD:
				// the HEAD only has 6 instead of the normal 12 crits
				return 5
				break
			
			case LEFT_ARM:
			case LEFT_TORSO:
			case CENTER_TORSO:
			case RIGHT_TORSO:
			case RIGHT_ARM:
				// account for skipping over the HEAD which only has 6
				return (critSectionIndex * 12) + 11 - 6 	//-(HEAD)
				break
				
			case LEFT_LEG:
				// the LEGS only have 6 instead of the normal 12 crits
				return (critSectionIndex * 12) + 5 - 6		//-(HEAD)
				break
			case RIGHT_LEG:
				// the LEGS only have 6 instead of the normal 12 crits
				return (critSectionIndex * 12) + 5 - 6 - 6	//-(HEAD) -(LEFT_LEG)
				break
				
			default: 
				return -1 
				break
		}
		
		return -1
	}
	
	/**
	 * Gets the crit section location index of the given critical slot index
	 * @param critIndex
	 * @return
	 */
	public static int getCritSectionIndexOf(int critIndex) {
		if(critIndex < 0 || critIndex >= NUM_CRITS) return -1
		
		for(int critSectionIndex in Mech.CRIT_LOCATIONS) {
			int critSectionStart = Mech.getCritSectionStart(critSectionIndex)
			int critSectionEnd = Mech.getCritSectionEnd(critSectionIndex)
			
			if(critIndex >= critSectionStart 
					&& critIndex <= critSectionEnd) {
				return critSectionIndex
			}
		}
		
		return -1
	}
	
	/**
	 * Gets the Equipment object at the given critical slot index
	 * @param critIndex
	 * @return
	 */
	public Equipment getEquipmentAt(int critIndex) {
		def thisCritId = this.crits.getAt(critIndex)
		return (thisCritId != null) ? Equipment.read(thisCritId) : null
	}
	
	/**
	 * Gets the Equipment array representing the crits array of just the given section location
	 * @param critSectionIndex
	 * @return
	 */
	public Equipment[] getCritSection(int critSectionIndex) {
		return mechService.getCritSection(this, critSectionIndex)
	}
	
	/**
	 * Gets the weight class of the mech based on its mass.
	 * * Mech.Light = 20-35
	 * * Mech.Medium = 40 - 55
	 * * Mech.Heavy = 60 - 75
	 * * Mech.Assault 80 - 100
	 * @return
	 */
	public String getWeightClass() {
		if(this.mass < 40) {
			return Mech.LIGHT
		}
		else if(this.mass < 60) {
			return Mech.MEDIUM
		}
		else if(this.mass < 80) {
			return Mech.HEAVY
		}
		else {
			return Mech.ASSAULT
		}
	}
	
	@Override
	public String toString() {
		return name+" "+chassis+"-"+variant
	}
}
