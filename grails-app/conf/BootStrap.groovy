import javax.servlet.ServletContext
import roguemek.*
import roguemek.model.*
import mek.mtf.*

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
			
			log.info('Initialized admin user '+admin.login)
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
		MechMTF.createMechFromMTF(new File("src/mtf/mechs/Assassin ASN-21.MTF"))
		
    }
    def destroy = {
    }
}
