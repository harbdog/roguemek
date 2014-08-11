package roguemek.model

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
	
	List crits
	
	Integer walkMP
	Integer jumpMP
	
	Long cbills
	Integer battleValue
	
	// STATIC value mappings
	public static Character IS = 'I'
	public static Character CLAN = 'C'
	
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

    static constraints = {
		name blank: false
		description nullable: true
		chassis blank: false
		variant blank: false
		
		tech inList: [IS, CLAN]
		faction nullable: true
		year range: 2014..3132
		
		mass range : 20..100, validator:{val, obj ->
			if(val % 5 != 0) {
				return false;
			}
		}
		
		armor size: 11..11
		internals size: 8..8
		crits size: 8..8
		
		walkMP min: 1
		jumpMP min: 0
		
		cbills min: 0L
		battleValue min: 0
    }
	
}
