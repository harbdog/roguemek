package roguemek.cache

import org.atmosphere.cache.CacheMessage

/**
 * Custom Atmosphere cache message domain object to support scaling without needing an external service
 */
class DomainCacheMessage {

	String id
	Long createTime
	Object message
	String uuid
	
	static mapping = {
		id generator: 'assigned'
		version false
	}
	
    static constraints = {
		message nullable: true
		uuid nullable: true
    }
	
	static transients = ['cacheMessage']
	public CacheMessage getCacheMessage() {
		return new CacheMessage(id, createTime, message, uuid)
	}
}
