import javax.servlet.ServletContext
import roguemek.*
import roguemek.model.*

class BootStrap {
	
	def bcryptService

    def init = { ServletContext servletContext ->
		def adminEmail = 'harbdog@gmail.com'
		def adminCallsign = 'CapperDeluxe'
		def adminHashedPassword = '$2a$10$nmZgrO4gwRp2yleO2g5WDefLip9ngLTnqLX3MVcJQ6X09cFWjBCoq'
		
		def admin = User.findByLogin(adminEmail)
		if(!admin) {
			// initialize testing admin user
			admin = new User(login: adminEmail, callsign: adminCallsign, password: adminHashedPassword)
			if(!admin.validate()) {
				log.error("Errors with admin "+admin.login+":\n")
				admin.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				admin.save()
			
				log.info('Initialized admin user '+admin.login)
			}
		}
		
		// Initialize factions
		Faction.init()
		
		// Initialize equipment, weapons, ammo, and heat sinks
		Equipment.init()
		JumpJet.init()
		HeatSink.init()
		Ammo.init()
		Weapon.init()
		
		
		// Initialize stock mechs
		Mech.init()
		
    }
    def destroy = {
    }
}
