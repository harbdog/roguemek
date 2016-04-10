package roguemek.cache

import grails.transaction.Transactional

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

/**
 * Custom Atmosphere broadcaster cache service using domain objects in the database to support scaling without needing an external service
 */
@Transactional
class DomainCacheService {
	private static Log log = LogFactory.getLog(this)

    def expireCache(long oldestCacheTime) {
		log.trace("Expiring cache before ${oldestCacheTime}")
		DomainCache.executeUpdate("DELETE DomainCache c WHERE c.cacheHeaderTime <= :time", [time: oldestCacheTime])
		DomainCacheMessage.executeUpdate("DELETE DomainCacheMessage m WHERE m.createTime <= :time", [time: oldestCacheTime])
    }

	DomainCache createCache(broadcasterId, time, uuid) {
		DomainCache domainCache = new DomainCache(
				uuid: uuid,
				broadcasterId: broadcasterId,
				cacheHeaderTime: time
		)
		
		domainCache.save flush:true, insert:true
		
		log.trace("New DomainCache: ${domainCache.uuid} : ${domainCache.broadcasterId}@${domainCache.cacheHeaderTime}")
		
		return domainCache
	}
	
	DomainCache getCache(broadcasterId, uuid) {
		return DomainCache.findByUuidAndBroadcasterId(uuid, broadcasterId)
	}
	
	DomainCacheMessage createCacheMessage(messageId, time, uuid, message) {
		DomainCacheMessage domainMessage
		
		def messageWithSameId = DomainCacheMessage.read(messageId)
		if (messageWithSameId == null) {
			domainMessage = new DomainCacheMessage(
					messageId: messageId,
					createTime: time,
					uuid: uuid
			)
			domainMessage.setMessage(message)
			domainMessage.save flush:true, insert:true
			
			log.trace("New DomainCacheMessage: ${domainMessage}")
		}
		
		return domainMessage
	}
	
	def getCacheMessagesAfterTime(long time) {
		return DomainCacheMessage.findAllByCreateTimeGreaterThan(time)
	}
	
	def clearCache(broadcasterId, uuid, messageId) {
		log.trace("Clearing cache for ${broadcasterId}:${uuid}, message:${messageId}")
		DomainCache.executeUpdate("DELETE DomainCache c WHERE c.uuid = :uuid AND c.broadcasterId = :broadcasterId", [uuid: uuid, broadcasterId: broadcasterId])
		DomainCacheMessage.executeUpdate("DELETE DomainCacheMessage m WHERE m.messageId = :id", [id: messageId])
	}
}
