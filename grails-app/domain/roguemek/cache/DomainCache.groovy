package roguemek.cache

/**
 * Custom Atmosphere cache domain object to support scaling without needing an external service
 */
class DomainCache {
	
	String uuid
	String broadcasterId
	Long cacheHeaderTime
	
	static mapping = {
		id generator: 'assigned', name: 'uuid'
		version false
	}
	
    static constraints = {
		uuid unique: false
    }
}
