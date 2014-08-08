package roguemek

class Mech {
	static searchable = {
		only = ['name', 'description', 'chassis', 'variant', 'mass']
	}
	
	// Configuration properties
	String name
	String description
	String chassis
	String variant
	
	Integer mass
	Integer[] armor
	Integer[] internals
	
	// static location indices
	static HEAD = 0;
	static LEFT_ARM = 1;
	static LEFT_TORSO = 2;
	static CENTER_TORSO = 3;
	static RIGHT_TORSO = 4;
	static RIGHT_ARM = 5;
	static LEFT_LEG = 6;
	static RIGHT_LEG = 7;
	static LEFT_REAR = 8;
	static CENTER_REAR = 9;
	static RIGHT_REAR = 10;
	
	static LEGS = [LEFT_LEG, RIGHT_LEG];
	static ARMS = [LEFT_ARM, RIGHT_ARM];
	
	// hit locations based on rolls in the order 2,3,4,5,6,7,8,9,10,11,12
	static FRONT_HIT_LOCATIONS	= [CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];
	static LEFT_HIT_LOCATIONS  = [LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, LEFT_LEG, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, RIGHT_LEG, HEAD];
	static RIGHT_HIT_LOCATIONS	= [RIGHT_TORSO, RIGHT_LEG, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_ARM, LEFT_LEG, HEAD];
	static REAR_HIT_LOCATIONS	= [CENTER_REAR, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_REAR, CENTER_REAR, LEFT_REAR, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];
	
	static TEST_ARM_ONLY_LOCATION = [LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM];
	
	// melee hit locations based on rolls 1,2,3,4,5,6
	static FRONT_PUNCH_LOCATIONS = [LEFT_ARM, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, HEAD];
	static LEFT_PUNCH_LOCATIONS  = [LEFT_TORSO, LEFT_TORSO, CENTER_TORSO, LEFT_ARM, LEFT_ARM, HEAD];
	static RIGHT_PUNCH_LOCATIONS = [RIGHT_TORSO, RIGHT_TORSO, CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, HEAD];
	static REAR_PUNCH_LOCATIONS  = [LEFT_ARM, LEFT_REAR, CENTER_REAR, RIGHT_REAR, RIGHT_ARM, HEAD];
	
	static FRONT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
	static LEFT_KICK_LOCATIONS  = [LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
	static RIGHT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG];
	static REAR_KICK_LOCATIONS  = FRONT_KICK_LOCATIONS;
	
	// internal structure points for each tonnage
	static INTERNAL_STRUCTURE = [
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
		description blank: true
		chassis blank: false
		variant blank: false
		
		mass range : 20..100, validator:{val, obj ->
			if(val % 5 != 0) {
				return false;
			}
		}
		
		armor nullable: true
		internals nullable: true
    }
}
