/**
 * You can make customizations directly to this configuration script before running/building, 
 * or copy and modify this script somewhere else and set its absolute path
 * as an Environment variable with the name ROGUEMEK_CONFIG (webapp restart required if running).
 * 
 * e.g. ROGUEMEK_CONFIG=C:\Users\roguemek\.grails\RogueMek-config.groovy
 */
roguemek {
	users {
		admin {
			username = "admin@roguemek.com"
			callsign = "SuperUser"
			password = "AdminAdmin"
		}
//		tester {		// optional user to create during webapp init
//			username = "demo@roguemek.com"
//			callsign = "DemoUser"
//			password = "DemoDemo"
//		}
	}
}

grails {
	mail {
		host = "smtp.gmail.com"
		port = 465
		username = "username@gmail.com"
		password = "PASSWORD"
		props = ["mail.smtp.auth":"true",
				 "mail.smtp.socketFactory.port":"465",
				 "mail.smtp.socketFactory.class":"javax.net.ssl.SSLSocketFactory",
				 "mail.smtp.socketFactory.fallback":"false"]
	}
	plugin {
		atmosphere_meteor {
			plugin {
				initializeBeans {
					delay = 10000  // milliseconds to delay initialization
					period = 3000  // milliseconds to retry initialization based on servletContext readiness (e.g. waiting finish all BootStrap activities)
					attempts = 100 // number of attempts the TimerTask will make before quitting
				}
			}
		}
	}
}
