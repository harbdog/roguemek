package roguemek.game

import static org.springframework.http.HttpStatus.*
import grails.plugin.springsecurity.annotation.Secured
import grails.transaction.Transactional
import grails.converters.*
import roguemek.*
import roguemek.model.*

@Transactional
class GameController {
	
	transient springSecurityService

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]
	
	GameService gameService
	GameControllerService gameControllerService
	
	def index() {
		def doRedirect = false;
		
		if(springSecurityService.isLoggedIn()) {
			Game g = Game.read(session.game)
			MekUser user = currentUser()
			
			if(g == null || user == null) {
				doRedirect = true
			}
			else {
				if(g.isInit()) {
					if(g.ownerUser == user) {
						// TODO: give owner User a button to start the game instead of auto starting
						log.info("Game("+g.id+") owner User "+user?.username+" is starting the game")
						
						def initSuccess = gameService.initializeGame(g)
						if(!initSuccess) {
							// there was a failure, redirect back to staging
							redirect controller: "staging", action: "staging", id: g.id
						}
					}
					else {
						// give participant pilots a screen showing they are waiting for the owner to start
						redirect controller: "staging", action: "staging", id: g.id
					}
				}
				else if(g.isOver()) {
					// give a screen that the game is over with some results
					redirect controller: "rogueMek", action: "debrief", id: g.id
				}
				else {
					log.info("User "+user?.username+" joining Game("+g.id+")")
					
					respond g
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
		MekUser user = currentUser()
		if(user == null) return
		
		Game g = Game.read(session.game)
		
		if(g.isOver()) {
			// game has ended
			def endGameData =  gameService.getEndGameData(g)
			render endGameData as JSON
			return
		}
		
		HexMap b = g?.board?.getHexMap()
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
		MekUser user = currentUser()
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
	 * This action is used to retrieve list of chat users in the session game
	 */
	@Transactional(readOnly = true)
	def listChatUsers() {
		MekUser user = currentUser()
		if(user == null) return
		
		Game game = Game.read(session.game)
		if(game == null) return
		
		def chatUsers = GameChatUser.executeQuery(
				'select u.chatUser from GameChatUser u where u.game=:game',
				[game: game]
		)
		
		def result = []
		chatUsers.each { MekUser chatUser ->
			def chatUserData = [userid: chatUser.id, username: chatUser.toString()]
			result.add(chatUserData)
		}
		
		render result as JSON
	}
	
	/**
	 * This action is used to ping the server
	 * @render JSON object containing updates to relay back to the client
	 */
	def ping() {
		def gameResponse = [ping: "pong"]
		render gameResponse as JSON
	}

	@Transactional(readOnly = true)
	@Secured(['ROLE_ADMIN'])
    def list(Integer max) {
        params.max = Math.min(max ?: 10, 100)
        respond Game.list(params), model:[gameInstanceCount: Game.count()]
    }

	@Transactional(readOnly = true)
	@Secured(['ROLE_ADMIN'])
    def show(Game gameInstance) {
        respond gameInstance
    }
	
	@Transactional(readOnly = true)
	@Secured(['ROLE_ROOT'])
	def test(Game gameInstance) {
		respond gameInstance
	}

	@Secured(['ROLE_ROOT'])
    def create() {
        respond new Game(params)
    }

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

	@Secured(['ROLE_ROOT'])
    def update(Game gameInstance) {
        if (gameInstance == null) {
            notFound()
            return
        }
		
		// clear and recreate users, spectators and units lists 
		// otherwise they can duplicate or not remove previous entries
		gameInstance.users.clear()
		gameInstance.spectators.clear()
		gameInstance.units.clear()
		
		if(params.users instanceof String) params.users = [params.users]
		params.users.each { it -> gameInstance.users.add(MekUser.read(it)) }
		
		if(params.spectators instanceof String) params.spectators = [params.spectators]
		params.spectators.each { it -> gameInstance.spectators.add(MekUser.read(it)) }
		
		if(params.units instanceof String) params.units = [params.units]
		params.units.each { it -> gameInstance.units.add(BattleUnit.read(it)) }
		
		gameInstance.validate()

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
		return MekUser.get(springSecurityService.principal.id)
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
