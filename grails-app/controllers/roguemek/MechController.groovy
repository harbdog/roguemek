package roguemek



import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional

@Transactional(readOnly = true)
class MechController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond Mech.list(params), model:[mechInstanceCount: Mech.count()]
    }

    def show(Mech mechInstance) {
        respond mechInstance
    }

    def create() {
        respond new Mech(params)
    }

    @Transactional
    def save(Mech mechInstance) {
        if (mechInstance == null) {
            notFound()
            return
        }
		
		log.info("Mech params: " + params.toString())

        if (mechInstance.hasErrors()) {
            respond mechInstance.errors, view:'create'
            return
        }

        mechInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'mech.label', default: 'Mech'), mechInstance.id])
                redirect mechInstance
            }
            '*' { respond mechInstance, [status: CREATED] }
        }
    }

    def edit(Mech mechInstance) {
        respond mechInstance
    }

    @Transactional
    def update(Mech mechInstance) {
        if (mechInstance == null) {
            notFound()
            return
        }

        if (mechInstance.hasErrors()) {
            respond mechInstance.errors, view:'edit'
            return
        }

        mechInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'Mech.label', default: 'Mech'), mechInstance.id])
                redirect mechInstance
            }
            '*'{ respond mechInstance, [status: OK] }
        }
    }

    @Transactional
    def delete(Mech mechInstance) {

        if (mechInstance == null) {
            notFound()
            return
        }

        mechInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'Mech.label', default: 'Mech'), mechInstance.id])
                redirect action:"index", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'mech.label', default: 'Mech'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
}
