package roguemek



import static org.springframework.http.HttpStatus.*
import roguemek.game.BattleMech;
import grails.transaction.Transactional

@Transactional(readOnly = true)
class BattleMechController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]
	
	transient springSecurityService
	
	def displayImage() {
		def bMech = BattleMech.findById(params.id)
		byte[] imageInByte = bMech.image
		response.contentType = 'image/png' // or the appropriate image content type
		response.outputStream << imageInByte
		response.outputStream.flush()
	}

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond BattleMech.list(params), model:[battleMechInstanceCount: BattleMech.count()]
    }

    def show(BattleMech battleMechInstance) {
        respond battleMechInstance
    }
	
	def battleInfo(BattleMech battleMechInstance) {
		respond battleMechInstance, model:[userInstance: currentUser()]
	}

    def create() {
        respond new BattleMech(params)
    }

    @Transactional
    def save(BattleMech battleMechInstance) {
        if (battleMechInstance == null) {
            notFound()
            return
        }

        if (battleMechInstance.hasErrors()) {
            respond battleMechInstance.errors, view:'create'
            return
        }

        battleMechInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'battleMech.label', default: 'BattleMech'), battleMechInstance.id])
                redirect battleMechInstance
            }
            '*' { respond battleMechInstance, [status: CREATED] }
        }
    }

    def edit(BattleMech battleMechInstance) {
        respond battleMechInstance
    }

    @Transactional
    def update(BattleMech battleMechInstance) {
        if (battleMechInstance == null) {
            notFound()
            return
        }

        if (battleMechInstance.hasErrors()) {
            respond battleMechInstance.errors, view:'edit'
            return
        }

        battleMechInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'BattleMech.label', default: 'BattleMech'), battleMechInstance.id])
                redirect battleMechInstance
            }
            '*'{ respond battleMechInstance, [status: OK] }
        }
    }

    @Transactional
    def delete(BattleMech battleMechInstance) {

        if (battleMechInstance == null) {
            notFound()
            return
        }

        battleMechInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'BattleMech.label', default: 'BattleMech'), battleMechInstance.id])
                redirect action:"index", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'battleMech.label', default: 'BattleMech'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
	
	private currentUser() {
		return MekUser.get(springSecurityService.principal.id)
	}
}
