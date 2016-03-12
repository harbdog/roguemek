import javax.servlet.ServletContext
import grails.util.Environment

import roguemek.*
import roguemek.assets.*
import roguemek.board.*
import roguemek.game.*
import roguemek.model.*

class BootStrap {

	def grailsApplication
	
    def init = { ServletContext servletContext ->
		
		/* Sample code for determining environment from grails.util.Environment */
		if (Environment.current == Environment.DEVELOPMENT) {
			// insert Development environment specific code here
			printClassPath this.class.classLoader
			log.debug("mail: "+grailsApplication.config.grails.mail)
        } 
		else if (Environment.current == Environment.TEST) {
            // insert Test environment specific code here
        } 
		else if (Environment.current == Environment.PRODUCTION) {
            // insert Production environment specific code here
        }
		
		// Initialize the Context helping for determining location of resource with or without using the war
		ContextHelper.setContext(servletContext)
		
		// Initialize the Hex Tileset
		HexTileset.init()
		
		def rootRole = Role.findByAuthority(Role.ROLE_ROOT)
		if(!rootRole) {
			rootRole = new Role(authority: Role.ROLE_ROOT).save(flush: true)
		}
		
		def adminRole = Role.findByAuthority(Role.ROLE_ADMIN)
		if(!adminRole) {
			adminRole = new Role(authority: Role.ROLE_ADMIN).save(flush: true)
		}
		
		def userRole = Role.findByAuthority(Role.ROLE_USER)
		if(!userRole) {
			userRole = new Role(authority: Role.ROLE_USER).save(flush: true)
		}
		
		assert Role.count == 3
		
		// Initialize names
		log.info('Initializing Names/Surnames... this may take a while if first time')
		Name.init()
		Surname.init()
		
		// random query name test
		log.info('Initialized Names/Surnames. Random query names test:')
		log.info("R: "+ Name.getRandom().name)
		log.info("F: "+ Name.getRandom(Name.GENDER_FEMALE).name)
		log.info("M: "+ Name.getRandom(Name.GENDER_MALE).name)
		log.info("S: "+ Surname.getRandom().surname)
		
		// use RogueMek-config.groovy to define initial users
		
		// Create Admin user with all Roles
		def adminUser = MekUser.findByUsername(grailsApplication.config.roguemek.users.admin.username)
		def adminPilot
		if(!adminUser) {
			// initialize testing admin user
			adminUser = new MekUser(grailsApplication.config.roguemek.users.admin)
			adminUser.enabled = true
			
			if(!adminUser.validate()) {
				log.error("Errors with admin "+adminUser.username+":\n")
				adminUser.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				adminUser.save flush:true
				
				// assign all roles to admin user
				MekUserRole.create adminUser, rootRole, true
				MekUserRole.create adminUser, adminRole, true
				MekUserRole.create adminUser, userRole, true
			
				log.info('Initialized admin user '+adminUser.username)
			}
			
			adminPilot = new Pilot(firstName: Name.getRandom().name, lastName: Surname.getRandom().surname, ownerUser: adminUser, status: Pilot.STATUS_ACTIVE)
			if(!adminPilot.validate()) {
				log.error("Errors with pilot "+adminPilot.firstName+":\n")
				adminPilot.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				adminPilot.save flush:true
				
				log.info('Initialized admin pilot '+adminPilot.toString())
			}
		}
		
		// Create optional test user with User role
		def createTester = grailsApplication.config.roguemek.users.tester?.username
		def testUser = MekUser.findByUsername(createTester)
		def testPilot
		if(createTester && !testUser) {
			// initialize testing admin user
			testUser = new MekUser(grailsApplication.config.roguemek.users.tester)
			testUser.enabled = true
			
			if(!testUser.validate()) {
				log.error("Errors with tester "+testUser.username+":\n")
				testUser.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				testUser.save flush:true
				
				// assign user role to test user
				MekUserRole.create testUser, userRole, true
			
				log.info('Initialized test user '+testUser.username)
			}
			
			testPilot = new Pilot(firstName: Name.getRandom().name, lastName: Surname.getRandom().surname, ownerUser: testUser, status: Pilot.STATUS_ACTIVE)
			if(!testPilot.validate()) {
				log.error("Errors with pilot "+testPilot.firstName+":\n")
				testPilot.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				testPilot.save flush:true
			
				log.info('Initialized test pilot '+testPilot.toString())
			}
		}
		
		assert MekUser.count() >= 1
		assert MekUserRole.count() >= 1
		assert Pilot.count() >= 1
		
		// Initialize maps
		HexMap.init()
		log.info('Initialized Maps')
		
		// Initialize factions
		Faction.init()
		log.info('Initialized Factions')
		
		// Initialize equipment, weapons, ammo, and heat sinks
		Equipment.init()
		JumpJet.init()
		HeatSink.init()
		Ammo.init()
		Weapon.init()
		log.info('Initialized Equipment')
		
		// Initialize stock mechs
		Mech.init()
		log.info('Initialized Mechs')
		
		// Initialize heat effects
		HeatEffect.initializeHeatEffects()
		
		// setting up some test BattleMech instances for the test game
		def battleMechA
		def battleMechB
		def battleMech2
		def battleMech3
		
		if(adminPilot) {
			// Initialize a sample BattleMech
			battleMechA = new BattleMech(pilot: adminPilot, mech: Mech.findByName("Stalker"), rgb: [255, 0, 0])
			if(!battleMechA.validate()) {
				log.error("Errors with battle mech "+battleMechA.mech?.name+":\n")
				battleMechA.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				battleMechA.save flush:true
			
				log.info('Initialized battle mech '+battleMechA.mech.name+" with ID="+battleMechA.id)
			}
			
			// and a 2nd mech for the admin pilot
			battleMechB = new BattleMech(pilot: adminPilot, mech: Mech.findByName("Firestarter"), rgb: [255, 105, 105])
			if(!battleMechB.validate()) {
				log.error("Errors with battle mech "+battleMechB.mech?.name+":\n")
				battleMechB.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				battleMechB.save flush:true
			
				log.info('Initialized battle mech '+battleMechB.mech.name+" with ID="+battleMechB.id)
			}
			
			/*if (Environment.current == Environment.DEVELOPMENT) {
				// testing creating ALL BattleMechs
				Mech.list().each {
					def thisBattleMech= new BattleMech(pilot: adminPilot, mech: it, rgb: [255, 0, 0])
					thisBattleMech.save flush: true
					
					log.info('Initialized test battle mech '+thisBattleMech.mech.name+" with ID="+thisBattleMech.id)
				}
			}*/
		}
		
		if(testPilot) {
			// and another BattleMech
			battleMech2 = new BattleMech(pilot: testPilot, mech: Mech.findByName("Warhammer"), rgb: [0, 0, 255])
			if(!battleMech2.validate()) {
				log.error("Errors with battle mech "+battleMech2.mech?.name+":\n")
				battleMech2.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				battleMech2.save flush:true
			
				log.info('Initialized battle mech '+battleMech2.mech.name+" with ID="+battleMech2.id)
			}
			
			// yet another BattleMech
			battleMech3 = new BattleMech(pilot: testPilot, mech: Mech.findByName("Blackjack"), rgb: [0, 255, 0])
			if(!battleMech3.validate()) {
				log.error("Errors with battle mech "+battleMech3.mech?.name+":\n")
				battleMech3.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				battleMech3.save flush:true
			
				log.info('Initialized battle mech '+battleMech3.mech.name+" with ID="+battleMech3.id)
			}
		}
		
		if(adminPilot && testPilot
				&& battleMechA && battleMechB && battleMech2 && battleMech3) {
			// Initialize a sample HexMap board
			HexMap boardMap = HexMap.findByName("Battletech")
			boardMap?.loadMap()
			log.info('Preloaded sample Board')
			
			// Initialize a sample Game
			Game sampleGame = new Game(ownerUser: adminUser, description: "The Battle of Wits")
			
			BattleHexMap battleBoardMap = new BattleHexMap(game: sampleGame, map: boardMap)
			sampleGame.board = battleBoardMap
			
			if(!sampleGame.validate()) {
				log.error("Errors with game:\n")
				sampleGame.errors.allErrors.each {
					log.error(it)
				}
			}
			else {
				sampleGame.save flush:true
				log.info('Initialized game '+sampleGame.id)
				
				// create staging data for the sample game
				StagingUser stagingAdmin = new StagingUser(
						game: sampleGame, user: adminUser, 
						startingLocation: Game.STARTING_NW, 
						rgbCamo: [255, 0, 0],
						units: [battleMechA, battleMechB])
				stagingAdmin.save flush:true
				
				StagingUser stagingTester = new StagingUser(
						game: sampleGame, user: testUser, 
						startingLocation: Game.STARTING_N, 
						rgbCamo: [0, 0, 255],
						units: [battleMech2, battleMech3])
				stagingTester.save flush:true
			}
		}
    }
	
    def destroy = {
    }
	
	def printClassPath(classLoader) {
		log.debug "$classLoader"
		classLoader.getURLs().each {url->
		   log.debug "- ${url.toString()}"
		}
		if (classLoader.parent) {
		   printClassPath(classLoader.parent)
		}
	  }
}
