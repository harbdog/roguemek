import javax.servlet.ServletContext

import roguemek.*
import roguemek.game.BattleMech
import roguemek.game.Pilot;
import roguemek.model.*

class BootStrap {

    def init = { ServletContext servletContext ->
		
		def rootRole = new Role(authority: 'ROLE_ROOT').save(flush: true)
		def adminRole = new Role(authority: 'ROLE_ADMIN').save(flush: true)
		def userRole = new Role(authority: 'ROLE_USER').save(flush: true)
		
		def adminEmail = 'harbdog@gmail.com'
		def adminCallsign = 'CapperDeluxe'
		def adminPassword = 'Pass99'
		
		def testEmail = 'roguemek@gmail.com'
		def testCallsign = 'RogueMek'
		def testPassword = 'Pass99'
		
		// Create Admin user with all Roles
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
			
			def adminPilot = new Pilot(firstName: "Rogue", lastName: "Mek", ownerUser: adminUser, status: Pilot.STATUS_ACTIVE)
			if(!adminPilot.validate()) {
				log.error("Errors with pilot "+adminPilot.firstName+":\n")
				adminPilot.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				adminPilot.save()
			
				log.info('Initialized admin pilot '+adminPilot.firstName)
			}
		}
		
		UserRole.create adminUser, rootRole, true
		UserRole.create adminUser, adminRole, true
		UserRole.create adminUser, userRole, true
		
		// Create test user with User role
		def testUser = User.findByUsername(testEmail)
		if(!testUser) {
			// initialize testing admin user
			testUser = new User(username: testEmail, callsign: testCallsign, password: testPassword, enabled: true)
			if(!testUser.validate()) {
				log.error("Errors with tester "+testUser.username+":\n")
				testUser.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				testUser.save()
			
				log.info('Initialized test user '+testUser.username)
			}
		}
		
		UserRole.create testUser, userRole, true
		
		assert User.count() == 2
		assert Role.count() == 3
		assert UserRole.count() == 4
		assert Pilot.count() == 1
		
		
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
		
		
		def battleMech = new BattleMech(ownerPilot: Pilot.get(1), mech: Mech.get(1))
		if(!battleMech.validate()) {
			log.error("Errors with battle mech "+battleMech.mech?.name+":\n")
			battleMech.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			battleMech.save()
		
			log.info('Initialized battle mech '+battleMech.mech.name)
		}
		assert BattleMech.count() == 1
    }
    def destroy = {
    }
}
