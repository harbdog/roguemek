dataSource {
    pooled = true
    jmxExport = true
	
	if(System.env.OPENSHIFT_POSTGRESQL_DB_USERNAME && System.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD) {
		// use the openshift postgres database
		driverClassName = "org.postgresql.Driver"
		username = System.env.OPENSHIFT_POSTGRESQL_DB_USERNAME
		password = System.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD
	}
	else{
		// fallback on local h2 database
		driverClassName = "org.h2.Driver"
		username = "sa"
		password = ""
	}
}
hibernate {
	// Postgres uses the random() extension, other databases may be different (e.g. rand() for MySQL)
	query.substitutions = 'random=random()'
	
    cache.use_second_level_cache = true
    cache.use_query_cache = false
//    cache.region.factory_class = 'net.sf.ehcache.hibernate.EhCacheRegionFactory' // Hibernate 3
    cache.region.factory_class = 'org.hibernate.cache.ehcache.EhCacheRegionFactory' // Hibernate 4
    singleSession = true // configure OSIV singleSession mode
}

// environment specific settings
environments {
    development {
        dataSource {
			dbCreate = "create-drop" // one of 'create', 'create-drop', 'update', 'validate', ''
			
			if(System.env.OPENSHIFT_POSTGRESQL_DB_HOST && System.env.OPENSHIFT_POSTGRESQL_DB_PORT) {
				url = "jdbc:postgresql://"+System.env.OPENSHIFT_POSTGRESQL_DB_HOST+":"+System.env.OPENSHIFT_POSTGRESQL_DB_PORT+"/roguemek"
			}
			else{
				url = "jdbc:h2:mem:devDb;MVCC=TRUE;LOCK_TIMEOUT=10000;DB_CLOSE_ON_EXIT=FALSE"
			}
        }
    }
    test {
        dataSource {
            dbCreate = "update"
			
			if(System.env.OPENSHIFT_POSTGRESQL_DB_HOST && System.env.OPENSHIFT_POSTGRESQL_DB_PORT) {
	            url = "jdbc:postgresql://"+System.env.OPENSHIFT_POSTGRESQL_DB_HOST+":"+System.env.OPENSHIFT_POSTGRESQL_DB_PORT+"/roguemek"
			}
			else {
				url = "jdbc:h2:mem:testDb;MVCC=TRUE;LOCK_TIMEOUT=10000;DB_CLOSE_ON_EXIT=FALSE"
			}
        }
    }
    production {
        dataSource {
            dbCreate = "update"
			
			if(System.env.OPENSHIFT_POSTGRESQL_DB_HOST && System.env.OPENSHIFT_POSTGRESQL_DB_PORT) {
	            url = "jdbc:postgresql://"+System.env.OPENSHIFT_POSTGRESQL_DB_HOST+":"+System.env.OPENSHIFT_POSTGRESQL_DB_PORT+"/roguemek"
			}
			else {
				url = "jdbc:h2:prodDb;MVCC=TRUE;LOCK_TIMEOUT=10000;DB_CLOSE_ON_EXIT=FALSE"
			}
			
            properties {
               // See http://grails.org/doc/latest/guide/conf.html#dataSource for documentation
               jmxEnabled = true
               initialSize = 5
               maxActive = 50
               minIdle = 5
               maxIdle = 25
               maxWait = 10000
               maxAge = 10 * 60000
               timeBetweenEvictionRunsMillis = 5000
               minEvictableIdleTimeMillis = 60000
               validationQuery = "SELECT 1"
               validationQueryTimeout = 3
               validationInterval = 15000
               testOnBorrow = true
               testWhileIdle = true
               testOnReturn = false
               jdbcInterceptors = "ConnectionState"
               defaultTransactionIsolation = java.sql.Connection.TRANSACTION_READ_COMMITTED
            }
        }
    }
}
