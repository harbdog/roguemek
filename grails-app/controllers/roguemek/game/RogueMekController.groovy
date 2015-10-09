package roguemek.game

import grails.plugin.springsecurity.annotation.Secured
import grails.converters.*
import roguemek.*
import roguemek.model.*

class RogueMekController {
	
	transient springSecurityService
	
	def index() {
		log.info('Starting the index action...')
		
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
	
	private MekUser currentUser() {
		return MekUser.get(springSecurityService.principal.id)
	}
}
