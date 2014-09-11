package roguemek.game

import roguemek.model.Mech;
import grails.plugin.springsecurity.annotation.Secured

class RogueMekController {
	// override default index method with list method
	//static defaultAction = 'list'
    
	def index() {
		log.info('Starting the index action...')
		
		[game:Game.get(1)]
	}
	
	def search(String q) {
		def searchResults = [:]
		if(q) {
			searchResults = Mech.search("${q}*")
			
			log.info("searchResults: ${searchResults}")
		}
		
		render template: 'searchResults', model: searchResults
	}
}
