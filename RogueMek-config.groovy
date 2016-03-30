/**
 * You can make customizations directly to this configuration script before running app server, 
 * or copy and modify this script somewhere else and set its absolute path as an
 * Environment variable with the name ROGUEMEK_CONFIG (webapp restart required if running).
 * 
 * e.g. ROGUEMEK_CONFIG=C:\Users\roguemek\.grails\RogueMek-config.groovy
 */
roguemek {
	users {
		admin {		// required super user administrator user to create during init
			username = "admin@roguemek.com"
			callsign = "SuperUser"
			password = "AdminAdmin"
		}
//		demo {		// optional initial demo user to create during init
//			username = "demo@roguemek.com"
//			callsign = "DemoUser"
//			password = "DemoDemo"
//		}
	}
	server {
		headerMessage = "This is a RogueMek server"	// the message at the top of the root index page
		preloadMaps = false	// set true to have all maps loaded during first server init (may take several minutes more)
	}
	registration {
		// Any new user attempting to register can be enabled by setting newUserEnable to one of the following settings:
		//  "email"		// (recommended) confirmation email is sent to registered email address with a link to enable new accounts
		//				// NOTE: "email" requires the grails mail settings to be provided or it will fail
		//  "public"	// registered accounts are automatically enabled
		//  "private"	// registered accounts must be enabled by an administrator
		//	"disable"	// only administrators can create accounts
		newUserEnable = "public"
	}
	game {
		settings {
			maxUserUnits = 12		// maximum units per user in a game
			maxBattleUnits = 24		// maximum units total in a game
			userStagingLimit = 3	// maximum staging battles per user
		}
	}
	external {
		settings {
			externalUnitLink = "http://www.sarna.net/wiki/"
		}
	}
}

dataSource {
	// default to local h2 database
	driverClassName = "org.h2.Driver"
	username = "sa"
	password = "AdminAdmin"

//	Example connection to a Postgres server using OS environment variables for the values:
//	driverClassName = "org.postgresql.Driver"
//	username = System.env.ROGUEMEK_DB_USERNAME
//	password = System.env.ROGUEMEK_DB_PASSWORD
//	url = "jdbc:postgresql://"+System.env.ROGUEMEK_DB_HOST+":"+System.env.ROGUEMEK_DB_PORT+"/"+(System.env.ROGUEMEK_DB_NAME)
//	logSql: true	// debugging option only
//	formatSql: true	// debugging option only
}

grails {
	mail {
//		host = "smtp.gmail.com"
//		port = 465
//		username = "username@gmail.com"
//		password = "PASSWORD"
//		props = ["mail.smtp.auth":"true",
//				 "mail.smtp.socketFactory.port":"465",
//				 "mail.smtp.socketFactory.class":"javax.net.ssl.SSLSocketFactory",
//				 "mail.smtp.socketFactory.fallback":"false"]
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

grails.plugin.springsecurity.secureChannel.definition = [
	//'/**':    'REQUIRES_SECURE_CHANNEL'	// Require HTTPS for all pages
]

log4j.external = {
	//trace "org.hibernate.type.descriptor.sql.BasicBinder"
	//debug "org.hibernate.SQL"
	//debug "roguemek"
}
