package roguemek.game

import javax.servlet.http.HttpServlet

import org.springframework.security.core.context.SecurityContext
import org.springframework.security.web.context.HttpSessionSecurityContextRepository

import roguemek.MekUser

class AbstractGameService extends HttpServlet{
	
	def isAuthenticated(request) {
		def httpSession = request?.getSession(false)
		def context = (SecurityContext) httpSession?.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY)
		if (context?.authentication?.isAuthenticated()
				&& context.authentication.principal.id != null) {
			return true
		}
		
		return false
	}
	
	def currentUser(request) {
		def httpSession = request?.getSession(false)
		def context = (SecurityContext) httpSession?.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY)
		if (context?.authentication?.isAuthenticated()) {
			return MekUser.get(context.authentication.principal.id)
		}
		
		return null
	}
	
	def currentRoles(request) {
		def httpSession = request?.getSession(false)
		def context = (SecurityContext) httpSession?.getAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY)
		if (context?.authentication?.isAuthenticated()) {
			return context.authentication.principal.authorities*.authority
		}
		
		return []
	}
}
