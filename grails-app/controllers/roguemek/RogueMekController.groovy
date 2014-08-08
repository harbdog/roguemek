package roguemek

import roguemek.model.Mech;

class RogueMekController {
	// override default index method with list method
	//static defaultAction = 'list'
    
	def index() {
		log.info('Starting the index action...')
		
		[mechPreview:Mech.list(max:5, sort:"name")]
	}
	
	def list() {
		log.info('Starting the list action...')
		
		try {
			def err = 1 / 0
		}
		catch(Exception e) {
			log.error('An exception was found in the wild: ', e)
			
			redirect action: "index"
			return
		}
		
		render 'Default page for RogueMek!'
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
