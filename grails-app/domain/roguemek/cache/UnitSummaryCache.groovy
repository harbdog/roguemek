package roguemek.cache

import grails.converters.JSON

/**
 * Class for caching data used to show in a summary unit preview
 *
 */
class UnitSummaryCache {
	
	String id
	String appVersion
	Long unitId
	String cacheAsJson
	
	static mapping = {
		id generator: 'uuid'
		version false
		cacheAsJson type: 'text'
	}
	
    static constraints = {
		appVersion blank: false
		unitId unique: true
		cacheAsJson blank: false
	}
	
	def grailsApplication
	
	// Defining the getters and setters for the cache transient will ensure the stored JSON string is converted to and from Map
	// http://stackoverflow.com/a/25760600/854696
	static transients = ['cache']
	public Map getCache() {
		return JSON.parse(cacheAsJson)
	}
	public void setCache(Map cache) {
		cacheAsJson = cache as JSON
	}
	
	def beforeValidate() {
		if(!appVersion) appVersion = grailsApplication.metadata['app.version']
	}
}
