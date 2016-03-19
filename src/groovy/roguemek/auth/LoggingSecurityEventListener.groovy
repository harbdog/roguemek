package roguemek.auth
 
import javax.servlet.http.*
import org.apache.commons.logging.LogFactory
import org.springframework.context.ApplicationListener
import org.springframework.security.authentication.event.AbstractAuthenticationEvent
import org.springframework.security.core.Authentication
import org.springframework.security.web.authentication.logout.LogoutHandler

import roguemek.MekUser
 
class LoggingSecurityEventListener implements
    ApplicationListener<AbstractAuthenticationEvent>, LogoutHandler {
 
    private static final log = LogFactory.getLog(this)
 
    void onApplicationEvent(AbstractAuthenticationEvent event) {
        event.authentication.with {
			if(event.class.simpleName == "InteractiveAuthenticationSuccessEvent") {
	            def username = principal.hasProperty('username')?.getProperty(principal) ?: principal
				
				def request = grails.plugin.springsecurity.web.SecurityRequestHolder.getRequest()
				def country = request.locale.country
				
	            log.debug "event=${event.class.simpleName} username=${username} " +
	                "remoteAddress=${details.remoteAddress} sessionId=${details.sessionId} country=${country}"
				
				// update the last login field on the user in the database
				def user = roguemek.MekUser.updateLastLogin(principal.id)
				if(user && user.country != country) {
					if(user.country == null) log.info "${username} (${details.remoteAddress}) setting country to ${country}"
					else log.info "${username} (${details.remoteAddress}) changing country from ${user.country} to ${country}"
					user.country = country
					user.save flush: true
				}
			}
        }
    }
 
    void logout(HttpServletRequest request, HttpServletResponse response, 
        Authentication authentication) {
        authentication.with {
            def username = principal.hasProperty('username')?.getProperty(principal) ?: principal
            log.debug "event=Logout username=${username} " +
                "remoteAddress=${details.remoteAddress} sessionId=${details.sessionId}"
        }
    }
}
