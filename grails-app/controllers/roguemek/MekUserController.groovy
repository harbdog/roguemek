package roguemek

import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import grails.plugin.springsecurity.annotation.Secured

import roguemek.stats.WinLoss
import roguemek.stats.KillDeath

@Transactional(readOnly = true)
class MekUserController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]
	
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
			def winLossList = WinLoss.findAllByUser(userInstance, [max: winLossMax, sort: "time", order: "desc"])
			
			def killDeathRatio = [KillDeath.countByKiller(userInstance), KillDeath.countByVictim(userInstance)]
			def killDeathCriteria = KillDeath.createCriteria()
			def killDeathList = killDeathCriteria.list(max: killDeathMax) {
				or {
					eq("killer", userInstance)
					eq("victim", userInstance)
				}
				order("time", "desc")
			}
			
			respond userInstance, model: [winLossList: winLossList, winLossRatio: winLossRatio, 
											killDeathList: killDeathList, killDeathRatio: killDeathRatio]
		}
		else {
			redirect url: "/"
		}
	}

	@Transactional
    def register() {
		if(request.method == 'POST') {
			MekUser u = new MekUser()
			u.properties['username', 'password', 'callsign'] = params
			if(u.password != params.confirm) {
				u.errors.rejectValue("password", "user.password.dontmatch")
				return [user:u]
			}
			
			// Only use email confirmation for new accounts if it was setup
			def emailConfirmationRequired = (grailsApplication.config.grails.mail.password != "PASSWORD")
			
			if(emailConfirmationRequired) {
				u.enabled = false
				u.confirmCode = UUID.randomUUID().toString()
			}
			else {
				u.enabled = true
			}
			
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
					log.warn("Grails mail not setup, skipping email registration for ${u.username}")
					
					// give the user role to the account
					Role userRole = Role.findByAuthority(Role.ROLE_USER)
					MekUserRole.create u, userRole, true
					
					render(view: "success", model: [message: "Your account is successfully registered as ${u.username}."])
					return
				}
				
				render(view: "index", model: [userInstance: u])
				redirect(action: "success")
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
		render(view:'success', model: [message: 'Your account has been created, it can be activated by visiting the confirmation link sent to your provided email address.']);
	}
	
	@Transactional
	def forgotPassword(String userid) {
		MekUser u = MekUser.get(userid)
		if(!u) {
			redirect action: 'index'
			return
		}
		
		u.confirmCode = UUID.randomUUID().toString()
		
		if(u.save(flush: true)) {
			try{
				mailService.sendMail {
					to u.username
					subject "RogueMek Password Reset for ${u.callsign}"
					html g.render(template:"mailResetPassword", model:[code:u.confirmCode])
				}
			}
			catch(org.springframework.mail.MailAuthenticationException e) {
				log.error e.toString()
			}
			
			render(view: "success", model: [message: 'The password reset link has been sent to your provided email address.'])
		}
		else {
			return [user:u]
		}
	}
	
	def resetPassword(String id) {
		MekUser u = MekUser.findByConfirmCode(id)
		if(!u) {
			redirect action: 'index'
			return
		}
		
		render(view: "updatePassword", model: [user: u])
	}
	
	@Transactional
	def updatePassword(String id) {
		MekUser u = MekUser.findByConfirmCode(id)
		if(!u) {
			redirect action: 'index'
			return
		}
		
		// password is coming in as an array? password:[<passwd>, Update]
		u.password = params.password?.first()
		
		if(u.password != params.confirm) {
			u.errors.rejectValue("password", "user.password.dontmatch")
			return [user:u]
		}
		
		u.confirmCode = null
		
		if(u.save(flush: true)) {
			render(view: "success", model: [message: 'Your have successfully updated your password.'])
		}
		else {
			return [user:u]
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
		return MekUser.get(springSecurityService.principal.id)
	}
}

