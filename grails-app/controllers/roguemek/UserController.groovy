package roguemek

import grails.transaction.Transactional;
import grails.plugin.springsecurity.annotation.Secured
import mek.command.LoginCommand;

class UserController {
	
	def beforeInterceptor = {
		log.info "Request from country: "+request.locale.country
	}
	
	def afterInterceptor =  { model ->
		log.info "$actionName: $model"
	}
	
	def index(Integer max) {
		params.max = Math.min(max ?: 10, 100)
		respond User.list(params), model:[userInstanceCount: User.count()]
	}
	
	def show(User userInstance) {
		if(userInstance == null) {
			redirect controller: 'RogueMek', action: 'index'
		}
		else {
			respond userInstance
		}
	}
	
	def showUser() {
		def callsignToSearchFor = params.callsign
		
		def userInstance = User.findByCallsign(callsignToSearchFor)
		
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect action: 'index'
		}
	}

    def register() {
		if(request.method == 'POST') {
			def u = new User()
			u.properties['username', 'password', 'callsign'] = params
			if(u.password != params.confirm) {
				u.errors.rejectValue("password", "user.password.dontmatch")
				return [user:u]
			}
			if(u.save()) {
				session.user = u
				redirect controller:"RogueMek"
			}
			else {
				return [user:u]
			}
		}
	}
	
	def login(LoginCommand cmd) {
		if(request.method == 'POST') {
			if(!cmd.hasErrors()) {
				session.user = cmd.getUser()
				render template: '/user/loginLanding'
			}
			else {
				render template: 'loginBox', model: [loginCmd:cmd]
			}
		}
		else {
			render template: 'loginBox'
		}
	}
	
	@Secured(['ROLE_ADMIN'])
	def edit(User userInstance) {
		respond userInstance
	}
	
	@Transactional
	def update(User userInstance) {
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
	@Secured(['ROLE_ADMIN'])
	def delete(User userInstance) {

		if (userInstance == null) {
			notFound()
			return
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
				flash.message = message(code: 'default.not.found.message', args: [message(code: 'mech.label', default: 'User'), params.id])
				redirect action: "index", method: "GET"
			}
			'*'{ render status: NOT_FOUND }
		}
	}
	
	def logout() {
		session.invalidate()
		redirect controller:'RogueMek'
	}
}
