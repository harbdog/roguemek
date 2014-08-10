package roguemek



import static org.springframework.http.HttpStatus.*
import roguemek.model.Weapon;
import grails.transaction.Transactional

@Transactional(readOnly = true)
class WeaponController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond Weapon.list(params), model:[weaponInstanceCount: Weapon.count()]
    }

    def show(Weapon weaponInstance) {
		
		if(weaponInstance.ammoTypes != null) {
			log.info(weaponInstance.ammoTypes)
		}
		else {
			log.info("no ammo")
		}
		
        respond weaponInstance
    }

    def create() {
        respond new Weapon(params)
    }

    @Transactional
    def save(Weapon weaponInstance) {
        if (weaponInstance == null) {
            notFound()
            return
        }

        if (weaponInstance.hasErrors()) {
            respond weaponInstance.errors, view:'create'
            return
        }

        weaponInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'weapon.label', default: 'Weapon'), weaponInstance.id])
                redirect weaponInstance
            }
            '*' { respond weaponInstance, [status: CREATED] }
        }
    }

    def edit(Weapon weaponInstance) {
        respond weaponInstance
    }

    @Transactional
    def update(Weapon weaponInstance) {
        if (weaponInstance == null) {
            notFound()
            return
        }

        if (weaponInstance.hasErrors()) {
            respond weaponInstance.errors, view:'edit'
            return
        }

        weaponInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'Weapon.label', default: 'Weapon'), weaponInstance.id])
                redirect weaponInstance
            }
            '*'{ respond weaponInstance, [status: OK] }
        }
    }

    @Transactional
    def delete(Weapon weaponInstance) {

        if (weaponInstance == null) {
            notFound()
            return
        }

        weaponInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'Weapon.label', default: 'Weapon'), weaponInstance.id])
                redirect action:"index", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'weapon.label', default: 'Weapon'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
}
