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
		
		// make sure the pilot is owned by the user
		def pilot = Pilot.get(params.pilot)
		if(pilot != null && !user.pilots.contains(pilot)) {
			pilot = null
		}
		
		// make sure the pilot is in the game
		def game = Game.get(params.game)
		if(game != null && !game.pilots.contains(pilot)) {
			game = null
		}
		
		if(game != null && pilot != null) {
			// if the pilot has a Unit in the game, set it as well
			for(BattleUnit u in game.units) {
				if(pilot == u.pilot) {
					session["unit"] = u.id
					break
				}
			}
			
			session["game"] = game.id
			session["pilot"] = pilot.id
			
			redirect controller: 'game'
		}
		else {
			redirect action: 'index'
		}
	}
	
	private User currentUser() {
		return User.get(springSecurityService.principal.id)
	}
}
