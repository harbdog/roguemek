package roguemek.game

import grails.plugin.springsecurity.annotation.Secured
import grails.converters.*
import roguemek.*
import roguemek.model.*

class RogueMekController {
	
	transient springSecurityService
	
	def index() {
		def userInstance = currentUser()
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect url: "/"
		}
	}
	
	/**
	 * Makes sure the authenticated user can play the provided game and pilot instances, 
	 * then forwards to the game with them in the session
	 */
	def playGame() {
		def user = currentUser()
		
		// TODO: make sure the user has a pilot in the game (it can be attached to the game even without a unit)
		def game = Game.get(params.game)
		
		if(game != null) {
			session["game"] = game.id
			session["user"] = user.id
			
			redirect controller: 'game'
		}
		else {
			redirect action: 'index'
		}
	}
	
	/**
	 * Generates the info needed to create a new battle
	 * @return
	 */
	def create() {
		def userInstance = currentUser()
		if(userInstance) {
			respond userInstance
		}
		else {
			redirect action: 'index'
		}
	}
	
	/**
	 * Creates the new battle as initializing
	 * @param gameInstance
	 * @return
	 */
	def saveCreate(Game gameInstance) {
		if (gameInstance == null) {
			notFound()
			return
		}
		
		def userInstance = currentUser()
		if(!userInstance) {
			redirect action: 'index'
		}
		
		gameInstance.ownerUser = userInstance
		gameInstance.validate()

		if (gameInstance.hasErrors()) {
			respond gameInstance.errors, view:'create'
			return
		}

		gameInstance.save flush:true

		request.withFormat {
			form multipartForm {
				flash.message = message(code: 'default.created.message', args: [message(code: 'game.label', default: 'Game'), gameInstance.description])
				redirect action: 'index'
			}
			'*' { respond gameInstance, [status: CREATED] }
		}
	}
	
	private MekUser currentUser() {
		return MekUser.get(springSecurityService.principal.id)
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
