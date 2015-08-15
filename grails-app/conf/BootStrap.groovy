import javax.servlet.ServletContext

import roguemek.*
import roguemek.assets.*
import roguemek.game.*
import roguemek.model.*

class BootStrap {

    def init = { ServletContext servletContext ->
		
		// Initialize the Hex Tileset
		HexTileset.init()
		
		
		def rootRole = new Role(authority: Role.ROLE_ROOT).save(flush: true)
		def adminRole = new Role(authority: Role.ROLE_ADMIN).save(flush: true)
		def userRole = new Role(authority: Role.ROLE_USER).save(flush: true)
		
		def adminEmail = 'harbdog@gmail.com'
		def adminCallsign = 'CapperDeluxe'
		def adminPassword = 'Pass99'
		
		def testEmail = 'roguemek@gmail.com'
		def testCallsign = 'RogueMekWarrior'
		def testPassword = 'Pass99'
		
		def sampleEmail = 'test@test.com'
		def sampleCallsign = 'TestWarrior'
		def samplePassword = 'Pass99'
		
		// Create Admin user with all Roles
		def adminUser = User.findByUsername(adminEmail)
		def adminPilot
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
				adminUser.save flush:true
			
				log.info('Initialized admin user '+adminUser.username)
			}
			
			adminPilot = new Pilot(firstName: "Rogue", lastName: "Mek", ownerUser: adminUser, status: Pilot.STATUS_ACTIVE)
			if(!adminPilot.validate()) {
				log.error("Errors with pilot "+adminPilot.firstName+":\n")
				adminPilot.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				adminPilot.save flush:true
			
				log.info('Initialized admin pilot '+adminPilot.firstName)
			}
		}
		
		UserRole.create adminUser, rootRole, true
		UserRole.create adminUser, adminRole, true
		UserRole.create adminUser, userRole, true
		
		// Create test user with User role
		def testUser = User.findByUsername(testEmail)
		def testPilot
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
				testUser.save flush:true
			
				log.info('Initialized test user '+testUser.username)
			}
			
			testPilot = new Pilot(firstName: "Testy", lastName: "Tester", ownerUser: testUser, status: Pilot.STATUS_ACTIVE)
			if(!testPilot.validate()) {
				log.error("Errors with pilot "+testPilot.firstName+":\n")
				testPilot.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				testPilot.save flush:true
			
				log.info('Initialized test pilot '+testPilot.firstName)
			}
		}
		
		UserRole.create testUser, userRole, true
		
		// Create sample user with User role
		def sampleUser = User.findByUsername(sampleEmail)
		def samplePilot
		if(!sampleUser) {
			// initialize testing admin user
			sampleUser = new User(username: sampleEmail, callsign: sampleCallsign, password: samplePassword, enabled: true)
			if(!sampleUser.validate()) {
				log.error("Errors with tester "+sampleUser.username+":\n")
				sampleUser.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				sampleUser.save flush:true
			
				log.info('Initialized test user '+sampleUser.username)
			}
			
			samplePilot = new Pilot(firstName: "Samply", lastName: "Sampler", ownerUser: sampleUser, status: Pilot.STATUS_ACTIVE)
			if(!samplePilot.validate()) {
				log.error("Errors with pilot "+samplePilot.firstName+":\n")
				samplePilot.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				samplePilot.save flush:true
			
				log.info('Initialized sample pilot '+samplePilot.firstName)
			}
		}
		
		UserRole.create sampleUser, userRole, true
		
		assert User.count() == 3
		assert Role.count() == 3
		assert UserRole.count() == 5
		assert Pilot.count() == 3
		
		
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
		
		// Initialize heat effects
		HeatEffect.initializeHeatEffects()
		
		
		// Initialize a sample HexMap board
		//File boardFile = new File("src/boards/battletech.board")
		File boardFile = new File("src/boards/80x17_Benj_7.board")
		HexMap boardMap = HexMap.loadBoardFile(boardFile)
		
		// Initialize a sample BattleMech
		def battleMech = new BattleMech(pilot: adminPilot, mech: Mech.findByName("BattleMaster"), x: 0, y: 0, heading: 3, rgb: [255, 0, 0])
		if(!battleMech.validate()) {
			log.error("Errors with battle mech "+battleMech.mech?.name+":\n")
			battleMech.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			battleMech.save flush:true
		
			log.info('Initialized battle mech '+battleMech.mech.name)
		}
		
		// and a 2nd mech for the admin pilot
		def battleMechB = new BattleMech(pilot: adminPilot, mech: Mech.findByName("Assassin"), x: 1, y: 0, heading: 3, rgb: [255, 105, 105])
		if(!battleMechB.validate()) {
			log.error("Errors with battle mech "+battleMechB.mech?.name+":\n")
			battleMechB.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			battleMechB.save flush:true
		
			log.info('Initialized battle mech '+battleMechB.mech.name)
		}
		
		// and another BattleMech
		def battleMech2 = new BattleMech(pilot: testPilot, mech: Mech.findByName("Warhammer"), x: 4, y: 4, heading: 5, rgb: [0, 0, 255])
		if(!battleMech2.validate()) {
			log.error("Errors with battle mech "+battleMech2.mech?.name+":\n")
			battleMech2.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			battleMech2.save flush:true
		
			log.info('Initialized battle mech '+battleMech2.mech.name)
		}
		
		// yet another BattleMech
		def battleMech3 = new BattleMech(pilot: testPilot, mech: Mech.findByName("Blackjack"), x: 5, y: 6, heading: 4, rgb: [0, 255, 0])
		if(!battleMech3.validate()) {
			log.error("Errors with battle mech "+battleMech3.mech?.name+":\n")
			battleMech3.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			battleMech3.save flush:true
		
			log.info('Initialized battle mech '+battleMech3.mech.name)
		}
		
		assert BattleMech.count() == 4
		
		// Initialize a sample Game
		Game sampleGame = new Game(ownerUser: adminUser, pilots: [adminPilot, testPilot, samplePilot], units: [battleMech, battleMechB, battleMech2, battleMech3], board: boardMap)
		
		if(!sampleGame.validate()) {
			log.error("Errors with game:\n")
			sampleGame.errors.allErrors.each {
				log.error(it)
			}
		}
		else {
			sampleGame.save flush:true
			battleMech.save flush:true
			log.info('Initialized game '+sampleGame.id)
		}
    }
    def destroy = {
    }
}
