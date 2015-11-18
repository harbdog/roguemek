class UrlMappings {

	static mappings = {
        "/$controller/$action?/$id?(.$format)?"{
            constraints {
                // apply constraints here
            }
        }
		
		name mechDetails: "/showMech/$chassis/$variant"{
			controller = 'mech'
			action = 'showMech'
			
			constraints {
				// apply constraints here
			}
		}
		
		name userDetails: "/showUser/$callsign"{
			controller = 'mekUser'
			action = 'showUser'
			
			constraints {
				// apply constraints here
			}
		}
		
		name playGame: "/play"{
			controller = 'rogueMek'
			action = 'index'
		}
		
		name battleGame: "/battle"{
			controller = 'game'
			action = 'index'
		}
		
		name debriefGame: "/debrief/$id"{
			controller = 'game'
			action = 'debrief'
		}
		
		"/"(view:"/index")
        "500"(view:'/error')
	}
}
