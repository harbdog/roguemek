package roguemek

import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import grails.plugin.springsecurity.annotation.Secured

@Transactional(readOnly = true)
class UserController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond User.list(params), model:[userInstanceCount: User.count()]
    }

	@Secured(['ROLE_ADMIN'])
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

	@Secured(['ROLE_ADMIN'])
    def create() {
        respond new User(params)
    }

    @Transactional
	@Secured(['ROLE_ADMIN'])
    def save(User userInstance) {
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
    def edit(User userInstance) {
        respond userInstance
    }

    @Transactional
	@Secured(['ROLE_ADMIN'])
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
	@Secured(['ROLE_ROOT'])
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
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'user.label', default: 'User'), params.id])
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

@grails.validation.Validateable
class LoginCommand {
	
	String login
	String password
	private u

	static constraints = {
		login blank:false, validator:{ val, obj ->
			if(!obj.user) {
				return "user.not.found"
			}
		}
		
		password blank:false, validator:{ val, obj ->
			if(obj.user && !obj.user.checkPassword(val)) {
				return "user.password.invalid"
			}
		}
	}
	
	User getUser() {
		if(!u && login) {
			u = User.findByLogin(login)
		}
		
		return u
	}
}

