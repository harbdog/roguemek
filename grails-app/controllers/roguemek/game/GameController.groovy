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
			User user = currentUser()
			
			if(g == null || user == null) {
				doRedirect = true
			}
			else {
				if(g.gameState == Game.GAME_INIT) {
					if(g.ownerUser == user) {
						// TODO: give owner User a button to start the game instead of auto starting
						log.info("Game("+g.id+") owner User "+user?.username+" is starting the game")
						
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
					log.info("User "+user?.username+" joining Game("+g.id+")")
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
		User user = currentUser()
		if(user == null) return
		
		Game g = Game.read(session.game)
		HexMap b = g?.board
		if(g == null || b == null) {
			return
		}
		
		// find any units the user controls
		def playerUnits = []
		for(BattleUnit unit in g.units) {
			Pilot pilot = unit.pilot
			
			for(Pilot p in user.pilots) {
				if(pilot.id == p.id) {
					playerUnits.add(unit.id)
				}
			}
		}
		
		BattleUnit turnUnit = g.getTurnUnit()
		
		def moveAP = null
		if(playerUnits.contains(turnUnit?.id)) {
			def forwardAP = gameService.getMoveAP(g, turnUnit, true, false)
			def backwardAP = gameService.getMoveAP(g, turnUnit, false, false)
			
			moveAP = [
				forward: forwardAP,
				backward: backwardAP
			]
		}
		
		def elements = [
			board: gameService.getHexMapRender(g),
			units: gameService.getUnitsRender(g),
			playerUnits: playerUnits,
			turnUnit: turnUnit.id,
			moveAP: moveAP
		]
		
		render elements as JSON
	}

	/**
	 * This action is called for any client action sent to the server for play and routes to 
	 * the helper for performing, which will then return messages to relay back to the client.
	 * @render JSON object containing messages to relay back to the client
	 */
	def action() {
		User user = currentUser()
		if(user == null) return
		
		Game game = Game.get(session.game)
		if(game == null) return
		
		def result = gameControllerService.performAction(game, user, params)
		if(result instanceof GameMessage) {
			// if the result is just a message, format it for returning as JSON
			result = [
				time: result.time,
				message: message(code: result.messageCode, args: result.messageArgs),
				data: result.data
			]
		}
		else if(result != null && result.message instanceof GameMessage) {
			// allow for a message embedded in a normal result for certain uses
			result.time = result.message.time
			result.data = result.message.data
			result.message = message(code: result.message.messageCode, args: result.message.messageArgs)
		}
		
		render result as JSON
	}
	
	/**
	 * This action is used to poll the server for continuous updates to the game
	 * @render JSON object containing updates to relay back to the client
	 */
	def poll() {
		// occasionally the client will poll just to determine response time
		def isPing = params.ping;
		if(isPing){
			def gameResponse = [ping: "pong"]
			log.debug("Pinged by user: "+currentUser())
			render gameResponse as JSON
			return;
		}
		
		User user = currentUser()
		if(user == null) return
		
		Game game = Game.get(session.game)
		if(game == null) return

		def pollResponse = gameControllerService.performPoll(game, user)
		def gameResponse = pollResponse.terminated ? pollResponse : [date: pollResponse.date]
		if(pollResponse.messageUpdates != null) {
			gameResponse.updates = []
			
			int index = 0
			for(GameMessage gm in pollResponse.messageUpdates) {
				def thisUpdate = [
					time: gm.time,
					message: message(code: gm.messageCode, args: gm.messageArgs),
					data: gm.data
				]
				
				gameResponse.updates[index++] = thisUpdate
			}
		}
		
		render gameResponse as JSON
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
