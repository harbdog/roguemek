package roguemek

import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import grails.plugin.springsecurity.annotation.Secured

@Transactional(readOnly = true)
class MekUserController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

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
		
		def userInstance = MekUser.findByCallsign(callsignToSearchFor)
		
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect action: 'index'
		}
	}

    def register() {
		if(request.method == 'POST') {
			def u = new MekUser()
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
}

