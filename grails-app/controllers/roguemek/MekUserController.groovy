package roguemek

import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import grails.plugin.springsecurity.annotation.Secured

import roguemek.stats.WinLoss
import roguemek.stats.KillDeath

@Transactional(readOnly = true)
class MekUserController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]
	
	private static String NEW_USER_EMAIL = "email"
	private static String NEW_USER_PUBLIC = "public"
	private static String NEW_USER_PRIVATE = "private"
	private static String NEW_USER_DISABLE = "disable"
	
	transient springSecurityService
	
	def grailsApplication
	def mailService

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond MekUser.list(params), model:[userInstanceCount: MekUser.count()]
    }

	@Secured(['ROLE_ADMIN'])
    def show(MekUser userInstance) {
		if(userInstance == null) {
			redirect controller: 'RogueMek', action: 'index'
		}
		else {
	        respond userInstance
	    }
	}

	def showUser() {
		def callsignToSearchFor = params.callsign
		def userInstance
		if(callsignToSearchFor == null) {
			userInstance = currentUser()
		}
		else {
			userInstance = MekUser.findByCallsign(callsignToSearchFor)
		}
		
		if(userInstance) {
			// allow parameters that load more
			def winLossMax = params.showAllWinLoss ? WinLoss.count() : 10
			def killDeathMax = params.showAllKillDeath ? KillDeath.count() : 25
			
			def winLossRatio = [WinLoss.countByUserAndWinner(userInstance, true), WinLoss.countByUserAndWinner(userInstance, false)]
			def winLossCriteria = WinLoss.createCriteria()
			def winLossList = winLossCriteria.list(max: winLossMax) {
				eq("user", userInstance)
				order("time", "desc")
			}
			
			def killDeathRatio = [KillDeath.countByKiller(userInstance), KillDeath.countByVictim(userInstance)]
			def killDeathCriteria = KillDeath.createCriteria()
			def killDeathList = killDeathCriteria.list(max: killDeathMax) {
				or {
					eq("killer", userInstance)
					eq("victim", userInstance)
				}
				order("time", "desc")
			}
			
			// some things show only to the user of the profile
			boolean isCurrentUser = (currentUser()?.id == userInstance.id) 
			
			respond userInstance, model: [winLossList: winLossList, winLossRatio: winLossRatio, 
											killDeathList: killDeathList, killDeathRatio: killDeathRatio,
											isCurrentUser: isCurrentUser]
		}
		else {
			redirect url: "/"
		}
	}

	@Transactional
    def register() {
		if(grailsApplication.config.roguemek.registration.newUserEnable == NEW_USER_DISABLE) {
			render(view: "success", model: [message: 'New accounts can only be created by an administrator.'])
			return
		}
		
		if(request.method == 'POST') {
			MekUser u = new MekUser()
			u.properties['username', 'password', 'callsign'] = params
			if(u.username != params.emailConfirm) {
				u.errors.rejectValue("username", "user.email.dontmatch")
				return [user:u]
			}
			if(u.password != params.confirm) {
				u.errors.rejectValue("password", "user.password.dontmatch")
				return [user:u]
			}
			
			def autoEnableAccounts = (grailsApplication.config.roguemek.registration.newUserEnable == NEW_USER_PUBLIC)
			def emailConfirmationRequired = (grailsApplication.config.roguemek.registration.newUserEnable == NEW_USER_EMAIL)
			
			if(emailConfirmationRequired) {
				u.confirmCode = UUID.randomUUID().toString()
			}
			
			u.enabled = autoEnableAccounts
			
			if(u.save(flush: true)) {
				if(emailConfirmationRequired) {
					try{
						mailService.sendMail {
							to u.username
							subject "RogueMek Registration for ${u.callsign}"
							html g.render(template:"mailConfirmUser", model:[code:u.confirmCode])
						}
					}
					catch(org.springframework.mail.MailAuthenticationException e) {
						log.error e.toString()
					}
				}
				else {
					// give the user role to the account
					Role userRole = Role.findByAuthority(Role.ROLE_USER)
					MekUserRole.create u, userRole, true
					
					if(autoEnableAccounts) {
						log.debug("Automatically enabling account for ${u.username}")
						render(view: "success", model: [message: "Your account is registered as ${u.username}. You may now login to your account!"])
					}
					else {
						log.debug("New account created without enabling for ${u.username}")
						render(view: "success", model: [message: "Your account is registered as ${u.username}. Activation will require an administrator to enable the account!"])
					}
					
					return
				}
				
				render(view: "index", model: [userInstance: u])
				redirect(action: "success", model: [message: 'Your account has been created, it can be activated by visiting the confirmation link sent to your provided email address.'])
			}
			else {
				return [user:u]
			}
		}
	}
	
	@Transactional
	def confirm(String id) {
		MekUser u = MekUser.findByConfirmCode(id)
		if(!u) {
			redirect action: 'index'
			return
		}

		// enable the user account
		u.confirmCode = null
		u.enabled = true
		
		// give the user role to the account
		Role userRole = Role.findByAuthority(Role.ROLE_USER)
		MekUserRole.create u, userRole, true
		
		if (!u.save(flush: true)) {
			render(view: "success", model: [message: 'Problem activating account.'])
			return
		}
		
		render(view: "success", model: [message: 'Your account is successfully activated.'])
	}
	
	def success(){
		render(view:'success', model: [message: 'Success!']);
	}
	
	@Transactional
	def forgotPassword() {
		MekUser u = MekUser.findByUsername(params?.username)
		
		if(!u) {
			if(params?.username?.length() > 0) {
				// for security purposes, don't let them know the email wasn't a register username
				render(view: "success", model: [message: "The password reset link has been sent to ${params?.username}."])
			}
			
			return
		}
		
		u.confirmCode = UUID.randomUUID().toString()
		
		if(u.save(flush: true)) {
			boolean mailSent = false
			
			if(grailsApplication.config.grails.mail?.host) {
				// only attempt to send mail if it looks like it might be configured
				try{
					mailService.sendMail {
						to u.username
						subject "RogueMek Password Reset for ${u.callsign}"
						html g.render(template:"mailResetPassword", model:[code:u.confirmCode])
					}
					
					mailSent = true
				}
				catch(org.springframework.mail.MailAuthenticationException e) {
					log.error e.toString()
				}
			}
			
			if(mailSent) {
				render(view: "success", model: [message: "The password reset link has been sent to ${params?.username}."])
			}
			else {
				render(view: "success", model: [message: 'Contact an administrator of this RogueMek site to provide a temporary password. You can change it after logging in and visiting your Profile page.'])
			}
		}
		else {
			return [user:u]
		}
	}
	
	def resetPassword(String id) {
		MekUser u
		if(id != null && id.length() > 0) {
			// user was sent here by confirmation code to reset the password
			u = MekUser.findByConfirmCode(id)
		}
		else {
			// logged in user was sent here by wanting to update their own password
			u = currentUser()
		}
		
		if(!u) {
			redirect action: 'index'
			return
		}
		
		render(view: "updatePassword", model: [user: u, confirmCode: u.confirmCode])
	}
	
	@Transactional
	def updatePassword() {
		if(request.method == 'POST') {
			String confirmId = params.id
			
			MekUser u
			if(confirmId != null && confirmId.length() > 0) {
				// user was sent here by confirmation code to reset the password
				u = MekUser.findByConfirmCode(confirmId)
			}
			else {
				// logged in user was sent here by wanting to update their own password
				u = currentUser()
			}
			
			if(!u) {
				redirect action: 'index'
				return
			}
			
			// password is coming in as an array? password:[<passwd>, Update]
			u.password = params.password
			
			if(u.password != params.confirm) {
				u.errors.rejectValue("password", "user.password.dontmatch")
				u.discard()
				return [user: u, confirmCode: confirmId]
			}
			
			u.confirmCode = null
			
			if(u.save(flush: true)) {
				render(view: "success", model: [message: 'You have successfully updated your password.'])
			}
			else {
				u.discard()
				return [user: u, confirmCode: confirmId]
			}
		}
	}

	@Secured(['ROLE_ADMIN'])
    def create() {
        respond new MekUser(params)
    }

    @Transactional
	@Secured(['ROLE_ADMIN'])
    def save(MekUser userInstance) {
        if (userInstance == null) {
            notFound()
            return
        }

        if (userInstance.hasErrors()) {
            respond userInstance.errors, view:'create'
            return
        }

        userInstance.save flush:true
		
		// give the user role to the account
		Role userRole = Role.findByAuthority(Role.ROLE_USER)
		MekUserRole.create userInstance, userRole, true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'user.label', default: 'User'), userInstance.id])
                redirect userInstance
            }
            '*' { respond userInstance, [status: CREATED] }
        }
    }

	@Secured(['ROLE_ADMIN'])
    def edit(MekUser userInstance) {
        respond userInstance
    }

    @Transactional
	@Secured(['ROLE_ADMIN'])
    def update(MekUser userInstance) {
        if (userInstance == null) {
            notFound()
            return
        }

        if (userInstance.hasErrors()) {
            respond userInstance.errors, view:'edit'
            return
        }

        userInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'User.label', default: 'User'), userInstance.id])
                redirect userInstance
            }
            '*'{ respond userInstance, [status: OK] }
        }
    }

    @Transactional
	@Secured(['ROLE_ROOT'])
    def delete(MekUser userInstance) {

        if (userInstance == null) {
            notFound()
            return
        }
		
		MekUserRole.findByUser(userInstance).each {
			it.delete flush:true
		}

        userInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'User.label', default: 'User'), userInstance.id])
                redirect action:"index", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'user.label', default: 'User'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
	
	private MekUser currentUser() {
		return springSecurityService.isLoggedIn() ? MekUser.get(springSecurityService.principal.id) : null
	}
}

