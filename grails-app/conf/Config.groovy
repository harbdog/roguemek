// locations to search for config files that get merged into the main config:
def ENV_NAME = "ROGUEMEK_CONFIG"

grails.config.locations = [
	"classpath:${appName}-config.groovy",
	"file:${appName}-config.groovy"
]

if(System.getenv(ENV_NAME)) {
	log.info "Including configuration file specified in environment: " + System.getenv(ENV_NAME)
	grails.config.locations << "file:" + System.getenv(ENV_NAME)
 
} else if(System.getProperty(ENV_NAME)) {
	log.info "Including configuration file specified on command line: " + System.getProperty(ENV_NAME)
	grails.config.locations << "file:" + System.getProperty(ENV_NAME)
 
} else {
	log.warn "No external configuration file defined with environment property name: ${ENV_NAME}"
}

grails.project.groupId = appName // change this to alter the default package name and Maven publishing destination

// The ACCEPT header will not be used for content negotiation for user agents containing the following strings (defaults to the 4 major rendering engines)
grails.mime.disable.accept.header.userAgents = ['Gecko', 'WebKit', 'Presto', 'Trident']
grails.mime.types = [ // the first one is the default format
    all:           '*/*', // 'all' maps to '*' or the first available format in withFormat
    atom:          'application/atom+xml',
    css:           'text/css',
    csv:           'text/csv',
    form:          'application/x-www-form-urlencoded',
    html:          ['text/html','application/xhtml+xml'],
    js:            'text/javascript',
    json:          ['application/json', 'text/json'],
    multipartForm: 'multipart/form-data',
    rss:           'application/rss+xml',
    text:          'text/plain',
    hal:           ['application/hal+json','application/hal+xml'],
    xml:           ['text/xml', 'application/xml']
]

// URL Mapping Cache Max Size, defaults to 5000
//grails.urlmapping.cache.maxsize = 1000

// Legacy setting for codec used to encode data with ${}
grails.views.default.codec = "html"

// The default scope for controllers. May be prototype, session or singleton.
// If unspecified, controllers are prototype scoped.
grails.controllers.defaultScope = 'singleton'

// GSP settings
grails {
    views {
        gsp {
            encoding = 'UTF-8'
            htmlcodec = 'xml' // use xml escaping instead of HTML4 escaping
            codecs {
                expression = 'html' // escapes values inside ${}
                scriptlet = 'html' // escapes output from scriptlets in GSPs
                taglib = 'none' // escapes output from taglibs
                staticparts = 'none' // escapes output from static template parts
            }
        }
        // escapes all not-encoded output at final stage of outputting
        // filteringCodecForContentType.'text/html' = 'html'
    }
}


grails.converters.encoding = "UTF-8"
// scaffolding templates configuration
grails.scaffolding.templates.domainSuffix = 'Instance'

// Set to false to use the new Grails 1.2 JSONBuilder in the render method
grails.json.legacy.builder = false
// enabled native2ascii conversion of i18n properties files
grails.enable.native2ascii = true
// packages to include in Spring bean scanning
grails.spring.bean.packages = []
// whether to disable processing of multi part requests
grails.web.disable.multipart=false

// request parameters to mask when logging exceptions
grails.exceptionresolver.params.exclude = ['password', 'confirm']

// configure auto-caching of queries by default (if false you can cache individual queries with 'cache: true')
grails.hibernate.cache.queries = false

// configure passing transaction's read-only attribute to Hibernate session, queries and criterias
// set "singleSession = false" OSIV mode in hibernate configuration after enabling
grails.hibernate.pass.readonly = false
// configure passing read-only to OSIV session by default, requires "singleSession = false" OSIV mode
grails.hibernate.osiv.readonly = false

environments {
    development {
        grails.logging.jul.usebridge = true
		grails.plugin.springsecurity.debug.useFilter = true
    }
    production {
        grails.logging.jul.usebridge = false
        // TODO: grails.serverURL = "http://www.changeme.com"
    }
}

// ElasticeSearch configuration
//elasticSearch.client.mode = 'local'

//elasticSearch.datastoreImpl = 'hibernateDatastore'

// log4j configuration
log4j.main = {
    // Example of changing the log pattern for the default console appender:
    //
    //appenders {
    //    console name:'stdout', layout:pattern(conversionPattern: '%c{2} %m%n')
    //}

    error  'org.codehaus.groovy.grails.web.servlet',        // controllers
           'org.codehaus.groovy.grails.web.pages',          // GSP
           'org.codehaus.groovy.grails.web.sitemesh',       // layouts
           'org.codehaus.groovy.grails.web.mapping.filter', // URL mapping
           'org.codehaus.groovy.grails.web.mapping',        // URL mapping
           'org.codehaus.groovy.grails.commons',            // core / classloading
           'org.codehaus.groovy.grails.plugins',            // plugins
           'org.codehaus.groovy.grails.orm.hibernate',      // hibernate integration
           'org.springframework',
           'org.hibernate',
           'net.sf.ehcache.hibernate'
		   
    fatal 'org.hibernate.tool.hbm2ddl.SchemaExport'
	
    // Set level for all application artifacts
    info "grails.app", "roguemek"
	
	warn "org.atmosphere"
	
	// Set for a specific controller in the default package
	//debug "grails.app.controllers.YourController"
	
	// Set for a specific domain class
	//debug "grails.app.domain.org.example.Book"
	
	// Set for a regular class
	//debug "roguemek.game.Roll"
   
	// Set for all taglibs
	//info "grails.app.taglib"
}


// Added by the Spring Security Core plugin:
grails.plugin.springsecurity.userLookup.userDomainClassName = 'roguemek.MekUser'
grails.plugin.springsecurity.userLookup.authorityJoinClassName = 'roguemek.MekUserRole'
grails.plugin.springsecurity.authority.className = 'roguemek.Role'
grails.plugin.springsecurity.useSecurityEventListener = true
grails.plugin.springsecurity.rememberMe.cookieName = 'roguemek_remember_me'
grails.plugin.springsecurity.rememberMe.key = 'BTechWarrior'
grails.plugin.springsecurity.onInteractiveAuthenticationSuccessEvent = { e, appCtx ->
	roguemek.MekUser.updateLastLogin(appCtx.springSecurityService.currentUser.id)
}
grails.plugin.springsecurity.logout.handlerNames = 
	['rememberMeServices', 'securityContextLogoutHandler',  'securityEventListener']
grails.plugin.springsecurity.controllerAnnotations.staticRules = [
	'/':							['permitAll'],
	'/index':						['permitAll'],
	'/index.gsp':					['permitAll'],
	'/debrief/**':					['permitAll'],
	'/mekUser/register':			['permitAll'],
	'/mekUser/confirm':				['permitAll'],
	'/mekUser/forgotPassword':		['permitAll'],
	'/mekUser/resetPassword':		['permitAll'],
	'/mekUser/updatePassword':		['permitAll'],
	'/mekUser/success':				['permitAll'],
	'/**/js/**':					['permitAll'],
	'/**/css/**':					['permitAll'],
	'/**/images/**':				['permitAll'],
	'/**/assets/**':				['permitAll'],
	'/**/favicon.ico':              ['permitAll'],
	'/login/**':          			['permitAll'],
	'/logout/**':					['permitAll'],
	
	'/showUser/**':					['ROLE_USER'],
	'/mekUser/**':					['ROLE_USER'],
	'/userList':					['ROLE_USER'],
	'/mech/display/**':				['ROLE_USER'],
	'/mech/showMech/**':			['ROLE_USER'],
	'/atmosphere/**':				['ROLE_USER'],
	'/battle/**':					['ROLE_USER'],
	'/staging/**':					['ROLE_USER'],
	'/abort/**':					['ROLE_USER'],
	'/rogueMek/**':					['ROLE_USER'],
	'/game/**':						['ROLE_USER'],
	'/battleMech/battleInfo/**':	['ROLE_USER'],
	'/battleMech/displayImage/**':	['ROLE_USER'],
	
	'/pilot/**':					['ROLE_ADMIN'],
	
	'/mekUserRole/**':				['ROLE_ROOT'],
	'/mech/**':						['ROLE_ROOT'],
	'/battleMech/**':				['ROLE_ROOT'],
	'/weapon/**':					['ROLE_ROOT'],
	'/dbconsole/**':				['ROLE_ROOT'],
]
