package roguemek.cache

import org.atmosphere.cpr.AtmosphereConfig
import org.atmosphere.cpr.AtmosphereResource
import org.atmosphere.cpr.BroadcasterCache
import org.atmosphere.cache.AbstractBroadcasterCache
import org.atmosphere.cache.CacheMessage
import org.atmosphere.cache.BroadcastMessage

import org.codehaus.groovy.grails.web.servlet.mvc.GrailsWebRequest
import org.codehaus.groovy.grails.web.util.WebUtils

import org.slf4j.Logger
import org.slf4j.LoggerFactory

import java.util.concurrent.TimeUnit
import javax.servlet.http.HttpSession

/**
 * Custom Atmosphere session broadcaster cache using domain objects in the database to support scaling without needing an external service
 */
class RoguemekBroadcasterCache extends AbstractBroadcasterCache {
	private static final Logger logger = LoggerFactory.getLogger(RoguemekBroadcasterCache.class)
	
	@Override
	public void start() {
		scheduledFuture = reaper.scheduleAtFixedRate(new Runnable() {

			public void run() {
				readWriteLock.writeLock().lock()
				try {
					long now = System.nanoTime()
					long oldestCacheTime = now - maxCacheTime
					
					List<CacheMessage> expiredMessages = new ArrayList<CacheMessage>()
					
					// find all caches and messages that are old and need to expire
					DomainCache.executeUpdate("DELETE DomainCache c WHERE c.cacheHeaderTime <= :time", [time: oldestCacheTime])
					DomainCacheMessage.executeUpdate("DELETE DomainCacheMessage m WHERE m.createTime <= :time", [time: oldestCacheTime])
					
				} finally {
					readWriteLock.writeLock().unlock()
				}
			}
		}, 0, invalidateCacheInterval, TimeUnit.MILLISECONDS)
	}
	
	@Override
	protected CacheMessage put(BroadcastMessage message, Long now, String uuid) {
		if (!inspect(message)) return null

		logger.trace("Caching domain message {} for Broadcaster {}", message.message())

		readWriteLock.writeLock().lock()
		CacheMessage cacheMessage = null
		try {
			def messageWithSameId = DomainCacheMessage.read(message.id())
			if (messageWithSameId == null) {
				DomainCacheMessage domainMessage = new DomainCacheMessage(
						createTime: now,
						message: message.message(),
						uuid: uuid
				)
				
				domainMessage.id = message.id()
				domainMessage.save flush:true
				
				cacheMessage = domainMessage.getCacheMessage()
			}
		} finally {
			readWriteLock.writeLock().unlock()
		}
		return cacheMessage
	}
	
	@Override
	protected List<Object> get(long cacheHeaderTime) {
		List<Object> result = new ArrayList<Object>()
		readWriteLock.readLock().lock()
		try {
			DomainCacheMessage.findAllByCreateTimeGreaterThan(cacheHeaderTime).each { DomainCacheMessage message ->
				result.add(message.getMessage())
			}

		} finally {
			readWriteLock.readLock().unlock()
		}

		logger.trace("Retrieved domain messages {}", result)
		return result
	}
	
	@Override
	public CacheMessage addToCache(String broadcasterId, String uuid, BroadcastMessage message) {
		long now = System.nanoTime()
		CacheMessage cacheMessage = put(message, now, uuid)

		if (uuid.equals(NULL)) return cacheMessage

		DomainCache domainCache = new DomainCache(
				broadcasterId: broadcasterId, 
				cacheHeaderTime: now
		)
		domainCache.uuid = uuid
		
		domainCache.save flush:true
		
		return cacheMessage
	}

	@Override
	public List<Object> retrieveFromCache(String broadcasterId, String uuid) {
		if (uuid == null) {
			throw new IllegalArgumentException("AtmosphereResource can't be null")
		}

		List<Object> result = new ArrayList<Object>()
		
		DomainCache domainCache = DomainCache.findByUuidAndBroadcasterId(uuid, broadcasterId)
		if(domainCache == null) return result
		
		Long cacheHeaderTime = domainCache.cacheHeaderTime
		
		return get(cacheHeaderTime)
	}
	
	@Override
	public BroadcasterCache clearCache(String broadcasterId, String uuid, CacheMessage cache) {
		if (cache != null) {
			DomainCache.executeUpdate("DELETE DomainCache c WHERE c.uuid = :uuid AND c.broadcasterId = :broadcasterId", [uuid: uuid, broadcasterId: broadcasterId])
			DomainCacheMessage.executeUpdate("DELETE DomainCacheMessage m WHERE m.id = :id", [id: cache.getId()])
		}
		return this;
	}
}
