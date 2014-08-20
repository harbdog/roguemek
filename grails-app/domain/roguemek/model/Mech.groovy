package roguemek.model

import mek.mtf.*

/**
 * Represents the stock or core Mech configuration
 */
class Mech {
	static searchable = {
		only = ['name', 'description', 'chassis', 'variant']
	}
	
	// Configuration properties
	String name
	String description
	String chassis
	String variant
	
	Character tech
	Faction faction
	Integer year
	
	Integer mass
	Integer[] armor
	Integer[] internals
	
	byte[] crits
	
	Integer walkMP
	Integer jumpMP
	
	Long cbills
	Integer battleValue
	
	// STATIC value mappings
	public static Character TECH_IS = 'I'
	public static Character TECH_CLAN = 'C'
	
	static constraints = {
		name blank: false
		description nullable: true
		chassis blank: false
		variant blank: false
		
		tech inList: [TECH_IS, TECH_CLAN]
		faction nullable: true
		year range: 0..3132
		
		mass range : 20..100, validator:{val, obj ->
			if(val % 5 != 0) {
				return false;
			}
		}
		
		armor size: 11..11
		internals size: 8..8
		
		// setting crits as bytes with maxSize 2048 since the arrays tend to get just under 1000 bytes 
		// where by default H2 was creating as 255 bytes
		crits maxSize: 2048, size: 78..78
		
		walkMP min: 1
		jumpMP min: 0
		
		cbills min: 0L
		battleValue min: 0
	}
	
	// static location indices
	public static HEAD = 0;
	public static LEFT_ARM = 1;
	public static LEFT_TORSO = 2;
	public static CENTER_TORSO = 3;
	public static RIGHT_TORSO = 4;
	public static RIGHT_ARM = 5;
	public static LEFT_LEG = 6;
	public static RIGHT_LEG = 7;
	public static LEFT_REAR = 8;
	public static CENTER_REAR = 9;
	public static RIGHT_REAR = 10;
	
	public static LEGS = [LEFT_LEG, RIGHT_LEG];
	public static ARMS = [LEFT_ARM, RIGHT_ARM];
	
	// hit locations based on rolls in the order 2,3,4,5,6,7,8,9,10,11,12
	public static FRONT_HIT_LOCATIONS	= [CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];
	public static LEFT_HIT_LOCATIONS  = [LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, LEFT_LEG, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, RIGHT_LEG, HEAD];
	public static RIGHT_HIT_LOCATIONS	= [RIGHT_TORSO, RIGHT_LEG, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_ARM, LEFT_LEG, HEAD];
	public static REAR_HIT_LOCATIONS	= [CENTER_REAR, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_REAR, CENTER_REAR, LEFT_REAR, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];
	
	// melee hit locations based on rolls 1,2,3,4,5,6
	public static FRONT_PUNCH_LOCATIONS = [LEFT_ARM, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, HEAD];
	public static LEFT_PUNCH_LOCATIONS  = [LEFT_TORSO, LEFT_TORSO, CENTER_TORSO, LEFT_ARM, LEFT_ARM, HEAD];
	public static RIGHT_PUNCH_LOCATIONS = [RIGHT_TORSO, RIGHT_TORSO, CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, HEAD];
	public static REAR_PUNCH_LOCATIONS  = [LEFT_ARM, LEFT_REAR, CENTER_REAR, RIGHT_REAR, RIGHT_ARM, HEAD];
	
	public static FRONT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
	public static LEFT_KICK_LOCATIONS  = [LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
	public static RIGHT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG];
	public static REAR_KICK_LOCATIONS  = FRONT_KICK_LOCATIONS;
	
	// internal structure points for each tonnage
	public static INTERNAL_STRUCTURE = [
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

	static void init() {
		def defaultMech = Mech.findByName("Atlas")
		if(defaultMech != null) {
			return
		}
		
		File mtfMechsPath = new File("src/mtf/mechs/")
		
		mtfMechsPath.listFiles().each { mtfFile ->
			if(mtfFile.isFile() && mtfFile.canRead()) {
				MechMTF.createMechFromMTF(mtfFile)
			}
		}
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
	
	public Equipment getEquipmentAt(int critIndex) {
		def thisCritId = this.crits.getAt(critIndex)
		return (thisCritId != null) ? Equipment.read(thisCritId) : null
	}
	
	/**
	 * Gets the Equipment array representing the crits array of just the give section 
	 * @param critSectionIndex
	 * @return
	 */
	public Equipment[] getCritSection(int critSectionIndex) {
		int critSectionStart = Mech.getCritSectionStart(critSectionIndex)
		int critSectionEnd = Mech.getCritSectionEnd(critSectionIndex)
		
		def critSection = []
		
		if(critSectionStart >= 0 && critSectionEnd < 78) {
			for(int i=critSectionStart; i<=critSectionEnd; i++) {
				critSection.add(this.getEquipmentAt(i))
			}
		}
		
		return critSection
	}
}
