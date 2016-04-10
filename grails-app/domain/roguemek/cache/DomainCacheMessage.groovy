package roguemek.cache

import org.atmosphere.cache.CacheMessage

import grails.converters.JSON

/**
 * Custom Atmosphere cache message domain object to support scaling without needing an external service
 */
class DomainCacheMessage {

	String messageId
	Long createTime
	String messageAsJson
	String uuid
	
	static mapping = {
		id generator: 'assigned', name: 'messageId'
		version false
		messageAsJson type: 'text'
	}
	
    static constraints = {
		messageAsJson blank: false
		uuid nullable: true
    }
	
	static transients = ['message', 'cacheMessage']
	public String getMessage() {
		if(messageAsJson == null) return null
		return JSON.parse(messageAsJson)
	}
	public void setMessage(JSON message) {
		messageAsJson = message
	}
	public CacheMessage getCacheMessage() {
		return new CacheMessage(messageId, createTime, message, uuid)
	}
	
	@Override
	public String toString() {
		return "[CacheMessage=${messageId}:${uuid}@${createTime}: ${getMessage()}]"
	}
}
