package roguemek.model

import groovy.sql.Sql
import grails.transaction.Transactional
import org.grails.plugins.csv.CSVMapReader

import roguemek.assets.ContextHelper

@Transactional
class NameService {
	
	def dataSource
	
	def initNames() {
		if(Name.count() == 0) {
			// using Groovy SQL batch insert methods to load almost 20x faster
			// https://geekcredential.wordpress.com/2012/05/25/bulk-insert-with-grails/
			def sql = new Sql(dataSource)
			
			// Create all names from csv
			sql.withBatch(20, "insert into Name (name, gender) values (:name, :gender)".toString()) { preparedStatement ->
				new InputStreamReader(ContextHelper.getContextSource("names/firstnames_female.csv")).eachCsvLine { tokens ->
					def name = tokens[0]
					if(name == null || "".equals(name)) return
					preparedStatement.addBatch(name:name, gender:Name.GENDER_FEMALE)
				}
			}
			
			sql.withBatch(20, "insert into Name (name, gender) values (:name, :gender)".toString()) { preparedStatement ->
				new InputStreamReader(ContextHelper.getContextSource("names/firstnames_male.csv")).eachCsvLine { tokens ->
					def name = tokens[0]
					if(name == null || "".equals(name)) return
					preparedStatement.addBatch(name:name, gender:Name.GENDER_MALE)
				}
			}
			
			sql.close()
		}
		
		if(Surname.count() == 0) {
			def sql = new Sql(dataSource)
			
			// Create all surnames from csv
			sql.withBatch(20, "insert into Surname (surname) values (:surname)".toString()) { preparedStatement ->
				new InputStreamReader(ContextHelper.getContextSource("names/surnames.csv")).eachCsvLine { tokens ->
					def name = tokens[0]
					if(name == null || "".equals(name)) return
					preparedStatement.addBatch(surname:name)
				}
			}
			
			sql.close()
		}
	}
}
