package mek.mtf

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log
import roguemek.model.*;

class MechMTF {
	private static Log log = LogFactory.getLog(this)
	
	// ordered index numbers of when each section occurs in an MTF file (each section is one that contains a colon in the line)
	private static int MTF_index= 0
	private static int MTF_VERSION = MTF_index ++
	private static int MTF_CONFIG = MTF_index ++
	private static int MTF_TECHBASE = MTF_index ++
	private static int MTF_ERA = MTF_index ++
	private static int MTF_RULES = MTF_index ++
	private static int MTF_MASS = MTF_index ++
	private static int MTF_ENGINE = MTF_index ++
	private static int MTF_STRUCTURE = MTF_index ++
	private static int MTF_MYOMER = MTF_index ++
	private static int MTF_HEATSINKS = MTF_index ++
	private static int MTF_WALKMP = MTF_index ++
	private static int MTF_JUMPMP = MTF_index ++
	private static int MTF_ARMOR = MTF_index ++
	private static int MTF_ARMOR_LA = MTF_index ++
	private static int MTF_ARMOR_RA = MTF_index ++
	private static int MTF_ARMOR_LT = MTF_index ++
	private static int MTF_ARMOR_RT = MTF_index ++
	private static int MTF_ARMOR_CT = MTF_index ++
	private static int MTF_ARMOR_HD = MTF_index ++
	private static int MTF_ARMOR_LL = MTF_index ++
	private static int MTF_ARMOR_RL = MTF_index ++
	private static int MTF_ARMOR_RTL = MTF_index ++
	private static int MTF_ARMOR_RTR = MTF_index ++
	private static int MTF_ARMOR_RTC = MTF_index ++
	private static int MTF_WEAPONS = MTF_index ++
	private static int MTF_CRITS_LA = MTF_index ++
	private static int MTF_CRITS_RA = MTF_index ++
	private static int MTF_CRITS_LT = MTF_index ++
	private static int MTF_CRITS_RT = MTF_index ++
	private static int MTF_CRITS_CT = MTF_index ++
	private static int MTF_CRITS_HD = MTF_index ++
	private static int MTF_CRITS_LL = MTF_index ++
	private static int MTF_CRITS_RL = MTF_index ++
	
	// important critical slot values
	private static String MTF_CRIT_EMPTY = "-Empty-"
	private static String MTF_CRIT_HEATSINK = "Heat Sink"
	private static String MTF_CRIT_JUMPJET = "Jump Jet"
	private static String MTF_CRIT_SHOULDER = "Shoulder"
	private static String MTF_CRIT_UP_ARM_ACT = "Upper Arm Actuator"
	private static String MTF_CRIT_LOW_ARM_ACT = "Lower Arm Actuator"
	private static String MTF_CRIT_HAND_ACT = "Hand Actuator"
	private static String MTF_CRIT_HIP = "Hip"
	private static String MTF_CRIT_UP_LEG_ACT = "Upper Leg Actuator"
	private static String MTF_CRIT_LOW_LEG_ACT = "Lower Leg Actuator"
	private static String MTF_CRIT_FOOT_ACT = "Foot Actuator"
	private static String MTF_CRIT_ENGINE = "Engine"
	private static String MTF_CRIT_FUSION_ENGINE = "Fusion Engine"
	private static String MTF_CRIT_GYRO = "Gyro"
	private static String MTF_CRIT_LIFE_SUPPORT = "Life Support"
	private static String MTF_CRIT_SENSORS = "Sensors"
	private static String MTF_CRIT_COCKPIT = "Cockpit"
	private static String MTF_CRIT_AMMO = "Ammo"
	
	private static Boolean isEngineCrit(critName){
		return (critName == MTF_CRIT_FUSION_ENGINE
				|| critName == MTF_CRIT_ENGINE);
	}
	
	public static Mech createMechFromMTF(File mtfFile) {
		if(mtfFile == null || !mtfFile.exists() || !mtfFile.canRead()) {
			return null
		}
		
		def map = [:]
		
		// initialize values not in the MTF spec
		map.cbills = 0
		map.battleValue = 0
		map.faction = null
		
		// initialize arrays
		map.armor = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		map.internals = [0, 0, 0, 0, 0, 0, 0, 0]
		map.crits = []
		
		// initialize section tracking indices
		int sectionIndex = -1
		int subIndex = -1
		
		def mtfLineList = mtfFile.readLines()
		int numLines = mtfLineList.size()
		for(int i=0; i<numLines; i++) {
			String line = mtfLineList.get(i).trim()
			
			// determine if this line starts a new section by containing a colon character (but not also having a comma)
			int colon = line.indexOf(":")
			int comma = line.indexOf(",")
			
			if(line.indexOf("Source:") != -1){
				// ignore the "Source:" line, since its not included in all MTF files and isn't needed yet anyway
				continue
			}
			else if(colon == -1 || comma != -1){
				// continue from previous section index
				if(line.length() > 0) {
					subIndex ++
				}
			}
			else{
				// the next section begins
				sectionIndex ++
				subIndex = 0
				
				// update the line to only contain the value after the colon
				line = line.substring(colon + 1).trim()
			}
			
			if(line.length() == 0) {
				continue
			}
			
			log.info(i+": section "+sectionIndex+", sub "+subIndex+"  |  "+line)
			
			switch(sectionIndex){
				case(MTF_VERSION):
							// mech chassis and variant are directly under the version section before the next section
							if(subIndex == 1) {
								map.name = line
							}
							else if(subIndex == 2) {
								int dashIndex = line.indexOf("-")
								if(dashIndex >= 0) {
									map.chassis = line.substring(0, dashIndex)
									map.variant = line.substring(dashIndex+1)
								}
								else {
									map.chassis = line
									map.variant = "?"
								}
							}
							break
				case(MTF_TECHBASE):
							map.tech = line.equals("Inner Sphere") ? Mech.IS : Mech.CLAN
							break
				case(MTF_ERA):
							map.year = Integer.valueOf(line)
							break
				case(MTF_MASS):
							map.mass = Integer.valueOf(line)
							
							// Assign internal structure values based on mass
							map.internals = Mech.INTERNAL_STRUCTURE[map.mass]
							
							break
				case(MTF_HEATSINKS):
							//TODO: setHeatsinksFromMTF(map, line)
							break
				case(MTF_WALKMP):
							map.walkMP = Integer.valueOf(line)
							break
				case(MTF_JUMPMP):
							map.jumpMP = Integer.valueOf(line)
							break
				case(MTF_ARMOR_LA):
							map.armor[Mech.LEFT_ARM] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_RA):
							map.armor[Mech.RIGHT_ARM] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_LT):
							map.armor[Mech.LEFT_TORSO] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_RT):
							map.armor[Mech.RIGHT_TORSO] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_CT):
							map.armor[Mech.CENTER_TORSO] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_HD):
							map.armor[Mech.HEAD] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_LL):
							map.armor[Mech.LEFT_LEG] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_RL):
							map.armor[Mech.RIGHT_LEG] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_RTL):
							map.armor[Mech.LEFT_REAR] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_RTR):
							map.armor[Mech.RIGHT_REAR] = Integer.valueOf(line)
							break
				case(MTF_ARMOR_RTC):
							map.armor[Mech.CENTER_REAR] = Integer.valueOf(line)
							break
				case(MTF_WEAPONS):
							//TODO: addWeaponFromMTF(map, line)
							break
				case(MTF_CRITS_LA):
				case(MTF_CRITS_RA):
				case(MTF_CRITS_LT):
				case(MTF_CRITS_RT):
				case(MTF_CRITS_CT):
				case(MTF_CRITS_HD):
				case(MTF_CRITS_LL):
				case(MTF_CRITS_RL):
							// add crits
							addCriticalsFromMTF(map.crits, line, sectionIndex)
							
							// if Hatchet, add as weapon to this location
							/*if(line == "Hatchet"){
								int thisLocation = (sectionIndex == MTF_CRITS_LA) ? LEFT_ARM : RIGHT_ARM
								if(hatchetLocations.indexOf(thisLocation) == -1){
									hatchetLocations.push(thisLocation)
								}
							}*/
								
							break
			
				default: break
			}
			
			//TODO: more stuff here
			
		}
		
		Mech mech = new Mech(map)
		if(!mech.validate()) {
			log.error("Errors with mech "+mech.name+":\n")
			mech.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			mech.save flush:true
			log.info("Created mech "+mech.name)
		}
		
		return mech
	}
	
	private static void addCriticalsFromMTF(List crits, String line, int mtfSectionIndex){
		// one crit is listed per line and in order, just push each entry after determining what it is
		if(crits == null || line == null || line.length() == 0) {
			return
		}
		
		int section = -1;
		switch(mtfSectionIndex){
			case(MTF_CRITS_LA): section = Mech.LEFT_ARM
								break
			case(MTF_CRITS_RA): section = Mech.RIGHT_ARM
								break
			case(MTF_CRITS_LT): section = Mech.LEFT_TORSO
								break
			case(MTF_CRITS_RT): section = Mech.RIGHT_TORSO
								break
			case(MTF_CRITS_CT): section = Mech.CENTER_TORSO
								break
			case(MTF_CRITS_LL): section = Mech.LEFT_LEG
								break
			case(MTF_CRITS_RL): section = Mech.RIGHT_LEG
								break
			case(MTF_CRITS_HD): section = Mech.HEAD
								break
								
			default: break
		}
		
		if(section == -1){
			log.error("Unknown MTF section index="+mtfSectionIndex+", line:"+line)
			return
		}
		
		def critSection = crits[section]
		if(critSection == null) {
			critSection = []
			crits[section] = critSection
		}
		
		def thisCrit = null;
		
		// look up weapon table to see if this is a weapon slot
		def critName = line;
		
		// Determine if it is a rear facing item
		def isRear = (critName.indexOf("(R)") != -1);
		if(isRear){
			critName = line.substring(0, critName.indexOf("(R)") - 1);
		}
		
		// TODO: determine how to model rear facing weapons
		/*def weaponClass = (MTF_WEAPON_TABLE[critName] != null) ? MTF_WEAPON_TABLE[critName].weapon : null;
		
		if(weaponClass != null){
			thisCrit = new WeaponSlot(line, weaponClass, isRear);
			
			//debug.log(" Weapon crit, rear="+isRear+": "+critName);
			if(isRear){
				// set an appropriate weapon to the rear location
				for(int i=0; i<mech.weapons.length; i++){
					def thisWeapon = mech.weapons[i];
					
					if(thisWeapon instanceof this[weaponClass]
							&& thisWeapon.getLocation() == section){
						switch(section){
							case LEFT_TORSO:
											thisWeapon.location = LEFT_REAR;
											break;
							
							case RIGHT_TORSO:
											thisWeapon.location = RIGHT_REAR;
											break;
								
							case CENTER_TORSO:
											thisWeapon.location = CENTER_REAR;
											break;
								
							default: break;
						}
						
						// stop after the first weapon set to the rear
						break;
					}
				}
			}
		}*/
		
		if(thisCrit == null){
			// search all Equipment for the item, if it is not found then create a new one with some default info
			def foundEquip = Equipment.findByName(critName)
			
			if(foundEquip) {
				thisCrit = foundEquip
			}
			else {
				// TODO: The findByAliases queries were all failing, so doing it the dumb way just to get past this part, fix it later!
				//def thisEquip = Equipment.findByAliases(critName)
				def equipList = Equipment.getAll()
	
				equipList.each { thisEquip ->
					if(thisEquip.aliases?.contains(critName)){
						thisCrit = thisEquip
						return
					}
				}
				
				if(thisCrit == null) {
					// create Equipment based on the incoming name so it has an object
					thisCrit = new Equipment([
							name:critName,
							shortName:critName,
							mass:0,
							crits:1,
							tech:Mech.IS,
							year:2014,
							cbills:0,
							battleValue:0])
					
					thisCrit.save()
					log.info("CREATED MISSING EQUIPMENT "+thisCrit.name)
				}
			}
		}
		
		critSection.push(thisCrit);
	}
}
