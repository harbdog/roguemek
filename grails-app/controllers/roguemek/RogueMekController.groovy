package roguemek

class RogueMekController {
	// override default index method with list method
	static defaultAction = 'list'
    
	def index() {
		log.info('Starting the index action...')
		render 'Welcome to RogueMek!'
	}
	
	def list() {
		log.info('Starting the list action...')
		render 'Default page for RogueMek!'
		
		try {
			def err = 1 / 0
		}
		catch(Exception e) {
			log.error('An exception was found in the wild: ', e)
			log.debug('DEBUGGING!!!')
		}
		
	}
}
