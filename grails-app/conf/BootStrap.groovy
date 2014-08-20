import javax.servlet.ServletContext

import roguemek.*
import roguemek.game.Pilot;
import roguemek.model.*

class BootStrap {
	
	def bcryptService

    def init = { ServletContext servletContext ->
		
		def rootRole = new Role(authority: 'ROLE_ROOT').save(flush: true)
		def adminRole = new Role(authority: 'ROLE_ADMIN').save(flush: true)
		def userRole = new Role(authority: 'ROLE_USER').save(flush: true)
		
		def adminEmail = 'harbdog@gmail.com'
		def adminCallsign = 'CapperDeluxe'
		def adminPassword = 'Pass99'
		
		def adminUser = User.findByUsername(adminEmail)
		if(!adminUser) {
			// initialize testing admin user
			adminUser = new User(username: adminEmail, callsign: adminCallsign, password: adminPassword, enabled: true)
			if(!adminUser.validate()) {
				log.error("Errors with admin "+adminUser.username+":\n")
				adminUser.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				adminUser.save()
			
				log.info('Initialized admin user '+adminUser.username)
			}
			
			def adminPilot = new Pilot(firstName: "Rogue", lastName: "Mek", ownerUser: adminUser, status: Pilot.STATUS_ACTIVE).save()
		}
		
		UserRole.create adminUser, rootRole, true
		UserRole.create adminUser, adminRole, true
		UserRole.create adminUser, userRole, true
		
		assert User.count() == 1
		assert Role.count() == 3
		assert UserRole.count() == 3
		
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
