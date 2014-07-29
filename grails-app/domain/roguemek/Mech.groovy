package roguemek

class Mech {
	// Configuration properties
	String name
	String description
	String chassis
	String variant
	
	int tonnage
	int[] armor
	int[] internals
	
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

    static constraints = {
		name blank: false
		description blank: true
		chassis blank: false
		variant blank: false
		
		tonnage range : 20..100, validator:{val, obj ->
			if(val % 5 != 0) {
				return false;
			}
		}
		
		armor nullable: true
		internals nullable: true
    }
}
