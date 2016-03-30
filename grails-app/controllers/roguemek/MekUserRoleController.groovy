package roguemek

import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import grails.plugin.springsecurity.annotation.Secured

@Transactional(readOnly = true)
class MekUserRoleController {

    static allowedMethods = [save: "POST", update: "PUT"]
	
	transient springSecurityService

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond MekUserRole.list(params), model:[userRoleInstanceCount: MekUserRole.count(), userInstance: currentUser()]
    }

	@Secured(['ROLE_ROOT'])
    def create() {
        respond new MekUserRole(params)
    }

    @Transactional
	@Secured(['ROLE_ROOT'])
    def save(MekUserRole mekUserRoleInstance) {
        if (mekUserRoleInstance == null) {
            notFound()
            return
        }

        if (mekUserRoleInstance.hasErrors()) {
            respond mekUserRoleInstance.errors, view:'create'
            return
        }

        mekUserRoleInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'userRole.label', default: 'UserRole'),
						"${mekUserRoleInstance.role.authority} - ${mekUserRoleInstance.user.username}"])
                redirect action: "index", id: mekUserRoleInstance.user.id
            }
            '*' { respond mekUserRoleInstance, [status: CREATED] }
        }
    }

    @Transactional
	@Secured(['ROLE_ROOT'])
    def delete() {
		MekUser currentUser = currentUser()
		
		Role role = Role.findByAuthority(params.authority)
		MekUser user = MekUser.get(params.userid)
		
		if (role == null || user == null || currentUser == null) {
			notFound()
			return
		}
		
		if(currentUser.id == user.id) {
			// do not allow user to remove roles from itself
			notFound()
			return
		}
		
		MekUserRole mekUserRoleInstance = MekUserRole.findByRoleAndUser(role, user)
		
        if (mekUserRoleInstance == null) {
            notFound()
            return
        }

        mekUserRoleInstance.delete flush:true

		flash.message = message(code: 'default.deleted.message', args: [message(code: 'UserRole.label', default: 'UserRole'), 
				"${role.authority} - ${user.username}"])
		redirect action: "index"
    }
	
	private MekUser currentUser() {
		return MekUser.get(springSecurityService.principal.id)
	}

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'userRole.label', default: 'UserRole'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
}
