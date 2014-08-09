import javax.servlet.ServletContext
import roguemek.*
import roguemek.model.*

class BootStrap {

    def init = { ServletContext servletContext ->
		def adminEmail = 'harbdog@gmail.com'
		def adminCallsign = 'CapperDeluxe'
		def adminInitialPassword = 'Pass99'
		
		def admin = User.findByLogin(adminEmail)
		if(!admin) {
			// initialize testing admin user
			admin = new User(login: adminEmail, callsign: adminCallsign, password: adminInitialPassword)
			admin.save()
			
			log.info('Initialized admin user '+admin.adminEmail)
		}
		// Initialize factions
		Faction.initFactions()
		
		// Initialize equipment, weapons, ammo, and heat sinks
		
		
		// Initialize stock mechs
		
    }
    def destroy = {
    }
}
