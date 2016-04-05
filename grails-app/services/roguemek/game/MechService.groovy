package roguemek.game

import roguemek.model.*
import grails.transaction.Transactional

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

@Transactional
class MechService {
	private static Log log = LogFactory.getLog(this)
	
	/**
	 * Gets the Equipment array representing the crits array of just the given section location
	 * @param mech
	 * @param critSectionIndex
	 * @return
	 */
	public Equipment[] getCritSection(Mech mech, int critSectionIndex) {
		int critSectionStart = Mech.getCritSectionStart(critSectionIndex)
		int critSectionEnd = Mech.getCritSectionEnd(critSectionIndex)
		
		// first gather list of equipment IDs that need to be retrieved
		def critSection = []
		def critSectionIds = []
		if(critSectionStart >= 0 && critSectionEnd < 78) {
			for(int i=critSectionStart; i<=critSectionEnd; i++) {
				critSectionIds.add(mech.crits.getAt(i))
			}
			critSectionIds.unique()
			
			// retrieve equipment objects from list of IDs
			def critMap = [:]
			def critCriteria = Equipment.createCriteria()
			def critList = critCriteria.list {
				'in'("id", critSectionIds)
			}
			
			// map ID to each object
			critList.each { Equipment equipObj ->
				critMap[equipObj.id] = equipObj
			}
			
			// place each equipment object in the correct order for the section
			for(int i=critSectionStart; i<=critSectionEnd; i++) {
				critSection.add(critMap[mech.crits.getAt(i)])
			}
		}
		
		return critSection
	}
	
	/**
	 * Gets all Equipment arrays keyed by the section index
	 * @return Array of arrays with Equipment objects
	 */
	public def getAllCritSections(Mech mech) {
		def allCritSections = []
		
		// improved performance by making this method only perform a single query for all crit objects
		def critMap = [:]
		def critIds = mech.crits.unique(false)
		
		def critCriteria = Equipment.createCriteria()
		def critList = critCriteria.list {
			'in'("id", critIds)
		}
		
		critList.each { Equipment equipObj ->
			critMap[equipObj.id] = equipObj
		}
		
		for(int critSectionIndex in Mech.CRIT_LOCATIONS) {
			int critSectionStart = Mech.getCritSectionStart(critSectionIndex)
			int critSectionEnd = Mech.getCritSectionEnd(critSectionIndex)
			
			def critSection = []
			if(critSectionStart >= 0 && critSectionEnd < 78) {
				// place each equipment object in the correct order for the section
				for(int i=critSectionStart; i<=critSectionEnd; i++) {
					critSection.add(critMap[mech.crits.getAt(i)])
				}
			}
			
			allCritSections[critSectionIndex] = critSection
		}
		
		return allCritSections
	}
	
	/**
	 * Gets the BattleEquipment array representing the crits array of just the given section
	 * @param battleMech
	 * @param critSectionIndex
	 * @return
	 */
	public BattleEquipment[] getCritSection(BattleMech battleMech, int critSectionIndex) {
		int critSectionStart = BattleMech.getCritSectionStart(critSectionIndex)
		int critSectionEnd = BattleMech.getCritSectionEnd(critSectionIndex)
		
		// first gather list of battle equipment IDs that need to be retrieved
		def critSection = []
		def critSectionIds = []
		if(critSectionStart >= 0 && critSectionEnd < 78) {
			for(int i=critSectionStart; i<=critSectionEnd; i++) {
				critSectionIds.add(battleMech.crits.getAt(i))
			}
			critSectionIds.unique()
			
			// retrieve equipment objects from list of IDs
			def critMap = [:]
			def critCriteria = BattleEquipment.createCriteria()
			def critList = critCriteria.list {
				'in'("id", critSectionIds)
			}
			
			// map ID to each object
			critList.each { BattleEquipment equipObj ->
				critMap[equipObj.id] = equipObj
			}
			
			// place each equipment object in the correct order for the section
			for(int i=critSectionStart; i<=critSectionEnd; i++) {
				critSection.add(critMap[battleMech.crits.getAt(i)])
			}
		}
		
		return critSection
	}
	
	/**
	 * Gets all BattleEquipment arrays keyed by the section index
	 * @return Array of arrays with BattleEquipment objects
	 */
	public def getAllCritSections(BattleMech battleMech) {
		def allCritSections = []
		
		// improved performance by making this method only perform a single query for all crit objects
		def critMap = [:]
		def critIds = battleMech.crits.unique(false)
		
		def critCriteria = BattleEquipment.createCriteria()
		def critList = critCriteria.list {
			'in'("id", critIds)
		}
		
		critList.each { BattleEquipment equipObj ->
			critMap[equipObj.id] = equipObj
		}
		
		for(int critSectionIndex in Mech.CRIT_LOCATIONS) {
			int critSectionStart = BattleMech.getCritSectionStart(critSectionIndex)
			int critSectionEnd = BattleMech.getCritSectionEnd(critSectionIndex)
			
			def critSection = []
			if(critSectionStart >= 0 && critSectionEnd < 78) {
				// place each equipment object in the correct order for the section
				for(int i=critSectionStart; i<=critSectionEnd; i++) {
					critSection.add(critMap[battleMech.crits.getAt(i)])
				}
			}
			
			allCritSections[critSectionIndex] = critSection
		}
		
		return allCritSections
	}
	
	/**
	 * Calculates the number of heat sinks included with the engine
	 * (Engine Rating divided by 25, rounded down)
	 * @param unit
	 * @return
	 */
	public int getEngineHeatSinks(Mech mech) {
		int heatSinks = 0
		if(mech == null) return heatSinks
		
		heatSinks = Math.floor(mech.engineRating / 25)
		
		return heatSinks
	}
}
