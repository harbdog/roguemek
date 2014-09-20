package roguemek.game

import static org.springframework.http.HttpStatus.*
import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*
import roguemek.model.*

@Transactional(readOnly = true)
class GameController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]
	
	def index() {
		log.info('Starting the index action...')
	}
	
	def getGameElements() {
		Game g = Game.get(params.gameId)
		HexMap b = g?.board
		if(g == null || b == null) {
			return
		}
		
		def elements = [
			board: b.getHexMapRender(),
			units: g.getUnitsRender()
		]
		
		render elements as JSON
	}
	
	def action() {
		GameControllerHelper helper = new GameControllerHelper(params)
		render helper.performAction() as JSON
	}

	@Secured(['ROLE_ADMIN'])
    def list(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond Game.list(params), model:[gameInstanceCount: Game.count()]
    }

	@Secured(['ROLE_ADMIN'])
    def show(Game gameInstance) {
        respond gameInstance
    }
	
	@Secured(['ROLE_ROOT'])
	def test(Game gameInstance) {
		respond gameInstance
	}
	
	@Secured(['ROLE_ROOT'])
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

	@Secured(['ROLE_ROOT'])
    def create() {
        respond new Game(params)
    }

    @Transactional
	@Secured(['ROLE_ROOT'])
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

	@Secured(['ROLE_ROOT'])
    def edit(Game gameInstance) {
        respond gameInstance
    }

    @Transactional
	@Secured(['ROLE_ROOT'])
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
	@Secured(['ROLE_ROOT'])
    def delete(Game gameInstance) {

        if (gameInstance == null) {
            notFound()
            return
        }

        gameInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'Game.label', default: 'Game'), gameInstance.id])
                redirect action:"list", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'game.label', default: 'Game'), params.id])
                redirect action: "list", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
}
