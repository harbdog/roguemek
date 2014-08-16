package roguemek


import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import grails.plugin.springsecurity.annotation.Secured

import roguemek.model.Weapon;

@Transactional(readOnly = true)
class WeaponController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond Weapon.list(params), model:[weaponInstanceCount: Weapon.count()]
    }

    def show(Weapon weaponInstance) {
        respond weaponInstance
    }

    def create() {
        respond new Weapon(params)
    }

	/*
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
    */

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
