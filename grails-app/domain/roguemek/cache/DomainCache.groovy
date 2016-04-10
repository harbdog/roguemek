package roguemek.cache

/**
 * Custom Atmosphere cache domain object to support scaling without needing an external service
 */
class DomainCache {
	
	String id
	
	String uuid
	String broadcasterId
	Long cacheHeaderTime
	
	static mapping = {
		id generator: 'uuid'
		version false
	}
	
    static constraints = {
		uuid nullable: true
		broadcasterId nullable: true
    }
}
