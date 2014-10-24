package roguemek.game

import static org.springframework.http.HttpStatus.*
import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*
import roguemek.*
import roguemek.model.*

@Transactional(readOnly = true)
class GameController {
	
	transient springSecurityService

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]
	
	GameService gameService
	GameControllerService gameControllerService
	
	def index() {
		def doRedirect = false;
		
		if(springSecurityService.isLoggedIn()) {
			Game g = Game.read(session.game)
			Pilot p = Pilot.read(session.pilot)
			
			if(g == null || p == null) {
				doRedirect = true
			}
			else {
				if(g.gameState == Game.GAME_INIT) {
					if(g.ownerPilot == p) {
						// TODO: give ownerPilot a button to start the game instead of auto starting
						log.info("Game("+g.id+") ownerPilot "+p.toString()+" is starting the game")
						
						gameService.initializeGame(g)
					}
					else {
						// TODO: give participant pilots a screen showing they are waiting for the owner to start
					}
				}
				else if(g.gameState == Game.GAME_OVER) {
					// TODO: give a screen that the game is over with some results
				}
				else {
					BattleUnit u = BattleUnit.read(session.unit)
					log.info("User "+currentUser()?.username+" joining Game("+g.id+") with Pilot("+p.toString()+") in Unit "+u)
				}
			}
		}
		else {
			doRedirect = true
		}
		
		if(doRedirect) {
			redirect controller: "RogueMek"
		}
	}
	
	/**
	 * This action is only called when the client first loads the game and is initializing.
	 * @render JSON object containing the game elements such as hex map and units
	 */
	def getGameElements() {
		Game g = Game.read(session.game)
		HexMap b = g?.board
		if(g == null || b == null) {
			return
		}
		
		BattleUnit u = BattleUnit.read(session.unit)
		BattleUnit turnUnit = g.units.get(g.unitTurn)
		
		def elements = [
			board: gameService.getHexMapRender(g),
			units: gameService.getUnitsRender(g),
			playerUnit: u.id,
			turnUnit: turnUnit.id
		]
		
		render elements as JSON
	}

	/**
	 * This action is called for any client action sent to the server for play and routes to 
	 * the helper for performing, which will then return messages to relay back to the client.
	 * @render JSON object containing messages to relay back to the client
	 */
	def action() {
		Game game = Game.get(session.game)
		Pilot pilot = Pilot.get(session.pilot)
		BattleUnit unit = BattleUnit.get(session.unit)
		
		render gameControllerService.performAction(game, pilot, unit, params) as JSON
	}
	
	/**
	 * This action is used to poll the server for continuous updates to the game
	 * @render JSON object containing updates to relay back to the client
	 */
	def poll() {
		Game game = Game.get(session.game)
		Pilot pilot = Pilot.get(session.pilot)
		
		// Give a slight delay before polling to give a small amount of time for an update to actually occur
		Thread.sleep(250)

		render gameControllerService.performPoll(game, pilot) as JSON
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
	
	private currentUser() {
		return User.get(springSecurityService.principal.id)
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
