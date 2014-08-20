package roguemek



import static org.springframework.http.HttpStatus.*
import roguemek.game.Pilot;
import grails.transaction.Transactional

@Transactional(readOnly = true)
class PilotController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond Pilot.list(params), model:[pilotInstanceCount: Pilot.count()]
    }

    def show(Pilot pilotInstance) {
        respond pilotInstance
    }

    def create() {
        respond new Pilot(params)
    }

    @Transactional
    def save(Pilot pilotInstance) {
        if (pilotInstance == null) {
            notFound()
            return
        }

        if (pilotInstance.hasErrors()) {
            respond pilotInstance.errors, view:'create'
            return
        }

        pilotInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'pilot.label', default: 'Pilot'), pilotInstance.id])
                redirect pilotInstance
            }
            '*' { respond pilotInstance, [status: CREATED] }
        }
    }

    def edit(Pilot pilotInstance) {
        respond pilotInstance
    }

    @Transactional
    def update(Pilot pilotInstance) {
        if (pilotInstance == null) {
            notFound()
            return
        }

        if (pilotInstance.hasErrors()) {
            respond pilotInstance.errors, view:'edit'
            return
        }

        pilotInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'Pilot.label', default: 'Pilot'), pilotInstance.id])
                redirect pilotInstance
            }
            '*'{ respond pilotInstance, [status: OK] }
        }
    }

    @Transactional
    def delete(Pilot pilotInstance) {

        if (pilotInstance == null) {
            notFound()
            return
        }

        pilotInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'Pilot.label', default: 'Pilot'), pilotInstance.id])
                redirect action:"index", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'pilot.label', default: 'Pilot'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
}
