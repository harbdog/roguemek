package roguemek.game



import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import roguemek.model.*

@Transactional(readOnly = true)
class GameController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond Game.list(params), model:[gameInstanceCount: Game.count()]
    }

    def show(Game gameInstance) {
        respond gameInstance
    }
	
	def test(Game gameInstance) {
		respond gameInstance
	}
	
	def testWeapon() {
		Weapon weapon
		BattleMech unit
		
		if(params.weapon.id != "null"){
			weapon = Weapon.get(params.weapon.id)
		}
		if(params.testUnit != "null"){
			unit = BattleMech.get(params.testUnit)
		}
		
		if(weapon != null && unit != null){
			unit.testDamage(weapon.damage)
			
			render ""+new Date()+"<br/>"+params+"<br/>"+"Fired "+weapon?.name+" at "+unit
		}
		else{
			render ""+new Date()+"<br/>"+params+"<br/>"+"No Weapon ("+weapon?.name+") or Unit ("+unit+") selected."
		}
	}

    def create() {
        respond new Game(params)
    }

    @Transactional
    def save(Game gameInstance) {
        if (gameInstance == null) {
            notFound()
            return
        }

        if (gameInstance.hasErrors()) {
            respond gameInstance.errors, view:'create'
            return
        }

        gameInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'game.label', default: 'Game'), gameInstance.id])
                redirect gameInstance
            }
            '*' { respond gameInstance, [status: CREATED] }
        }
    }

    def edit(Game gameInstance) {
        respond gameInstance
    }

    @Transactional
    def update(Game gameInstance) {
        if (gameInstance == null) {
            notFound()
            return
        }

        if (gameInstance.hasErrors()) {
            respond gameInstance.errors, view:'edit'
            return
        }

        gameInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'Game.label', default: 'Game'), gameInstance.id])
                redirect gameInstance
            }
            '*'{ respond gameInstance, [status: OK] }
        }
    }

    @Transactional
    def delete(Game gameInstance) {

        if (gameInstance == null) {
            notFound()
            return
        }

        gameInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'Game.label', default: 'Game'), gameInstance.id])
                redirect action:"index", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'game.label', default: 'Game'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
}
