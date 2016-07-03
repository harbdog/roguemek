package roguemek.game

import java.net.URL

class AtmosphereTagLib {
    static defaultEncodeAs = [taglib:'text']
    //static encodeAsForTags = [tagName: [taglib:'html'], otherTagName: [taglib:'none']]
	
	def grailsApplication
    
    /**
	 * Generates the Atmosphere URL for connection from the client
	 */
	def atmosphereURL = { attrs, body ->
        def url = createLink(uri: "/atmosphere", absolute: true)
        
        def hpgWebSocketPort = grailsApplication.config.roguemek.server.hpgWebSocketPort
        if(hpgWebSocketPort != null && hpgWebSocketPort.isInteger()) {
            def modURL = new URL(url)
            modURL.set(modURL.getProtocol(), modURL.getHost(), Integer.valueOf(hpgWebSocketPort), modURL.getFile(), modURL.getRef())
            url = modURL.toURI()
        }
        
		out << url
	}
}
