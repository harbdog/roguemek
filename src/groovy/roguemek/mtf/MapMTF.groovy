package roguemek.mtf

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

/**
 * Class for importing an MTF file into a LinkedHashMap that can easily be used to generate Mechs
 */
class MapMTF {
	
	// Main sections
	public static String MTF_VERSION = "Version"
	public static String MTF_CONFIG = "Config"
	public static String MTF_TECHBASE = "TechBase"
	public static String MTF_ERA = "Era"
	public static String MTF_SOURCE = "Source"
	public static String MTF_RULES = "Rules Level"
	public static String MTF_MASS = "Mass"
	public static String MTF_ENGINE = "Engine"
	public static String MTF_STRUCTURE = "Structure"
	public static String MTF_MYOMER = "Myomer"
	public static String MTF_HEATSINKS = "Heat Sinks"
	public static String MTF_WALKMP = "Walk MP"
	public static String MTF_JUMPMP = "Jump MP"
	public static String MTF_ARMOR = "Armor"
	public static String MTF_WEAPONS = "Weapons"
	public static String MTF_LEFT_ARM = "Left Arm"
	public static String MTF_RIGHT_ARM = "Right Arm"
	public static String MTF_LEFT_TORSO = "Left Torso"
	public static String MTF_RIGHT_TORSO = "Right Torso"
	public static String MTF_CENTER_TORSO = "Center Torso"
	public static String MTF_HEAD = "Head"
	public static String MTF_LEFT_LEG = "Left Leg"
	public static String MTF_RIGHT_LEG = "Right Leg"
	
	// Ancillary sections
	public static String MTF_LA_ARMOR = "LA Armor"
	public static String MTF_RA_ARMOR = "RA Armor"
	public static String MTF_LT_ARMOR = "LT Armor"
	public static String MTF_RT_ARMOR = "RT Armor"
	public static String MTF_CT_ARMOR = "CT Armor"
	public static String MTF_HD_ARMOR = "HD Armor"
	public static String MTF_LL_ARMOR = "LL Armor"
	public static String MTF_RL_ARMOR = "RL Armor"
	public static String MTF_RTL_ARMOR = "RTL Armor"
	public static String MTF_RTR_ARMOR = "RTR Armor"
	public static String MTF_RTC_ARMOR = "RTC Armor"
	
		
	// Defines the main sections that will each reside in the root of the map
	private static def MTF_MAIN_SECTIONS = [
		MTF_VERSION, MTF_CONFIG, MTF_TECHBASE, MTF_ERA, MTF_SOURCE,
		MTF_RULES, MTF_MASS, MTF_ENGINE, MTF_STRUCTURE, MTF_MYOMER, 
		MTF_HEATSINKS, MTF_WALKMP, MTF_JUMPMP, MTF_ARMOR, MTF_WEAPONS, 
		MTF_LEFT_ARM, MTF_RIGHT_ARM, MTF_LEFT_TORSO, MTF_RIGHT_TORSO,
		MTF_CENTER_TORSO, MTF_HEAD, MTF_LEFT_LEG, MTF_RIGHT_LEG
	]
	
	/**
	 * Generates a Map of the info in arrays representing each section
	 * @param mtfFile
	 * @return LinkedHashMap representing the contents of the file
	 */
	public static LinkedHashMap createMapFromMTF(File mtfFile) {
		if(mtfFile == null || !mtfFile.exists() || !mtfFile.canRead()) {
			return null
		}
		
		LinkedHashMap map = [:]
		
		// Hold the name of the most recent main section
		def sectionName
		
		def mtfLineList = mtfFile.readLines()
		int numLines = mtfLineList.size()
		for(int i=0; i<numLines; i++) {
			String line = mtfLineList.get(i).trim()
			
			// determine if this line starts a new section by containing a colon character (but not also having a comma)
			int colon = line.indexOf(":")
			
			if(colon > 0) {
				def name = line.substring(0, colon).trim()
				
				if(MTF_MAIN_SECTIONS.contains(name)) {
					// A new main section has begun
					sectionName = name
					
					// update the line to only contain the value after the colon
					line = line.substring(colon + 1).trim()
				}
			}
			
			if(line.length() == 0) {
				continue
			}
			
			def sectionList = map[sectionName]
			if(sectionList == null) {
				sectionList = []
				map[sectionName] = sectionList
			}
			
			sectionList.add(line)
		}
		
		return map
	}
}
