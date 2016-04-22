package roguemek.model

import org.grails.plugins.csv.CSVMapReader
import roguemek.assets.ContextHelper

class Equipment {
	static searchable = {
		only = ['name', 'description', 'shortName']
	}

    String name
	String shortName
	static hasMany = [aliases:String]
	String description

	Character tech
	Faction faction
	Integer year

	Double mass
	Integer crits
	Long cbills
	Integer battleValue

	// STATIC value mappings
	public static final Character TECH_IS = 'I'
	public static final Character TECH_CLAN = 'C'

	public static final String EMPTY = "-Empty-"
	
	private static Equipment emptyEquip

	static mapping = {
		// All extending classes will get their own tables
		tablePerHierarchy false
		// Model classes do not change values, versioning not needed
		version false
	}

    static constraints = {
		name blank: false
		shortName nullable: true
		description nullable: true

		tech inList: [TECH_IS, TECH_CLAN]
		faction nullable: true
		year range: 0..3132

		mass min: 0.0D
		crits min: 0
		cbills min: 0L
		battleValue min: 0
    }

	/**
	 * Method used for converting the input aliases comma separated string into an array
	 * @param map
	 */
	private static void updateAliases(LinkedHashMap map) {
		String aliases = map.aliases
		if(aliases.contains(",")) {
			map.aliases = []
			aliases.split(",").each{
				map.aliases.add(it)
			}
		}
	}
	
	public static Equipment getEmpty() {
		if(emptyEquip == null) {
			emptyEquip = Equipment.findByName(Equipment.EMPTY)
		}
		return emptyEquip
	}

	public boolean isEmpty() {
		return EMPTY.equals(this.name)
	}

	@Override
	public String toString() {
		return "<Equipment:"+name+">"
	}
}
