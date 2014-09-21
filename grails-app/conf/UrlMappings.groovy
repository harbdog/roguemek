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
			controller = 'user'
			action = 'showUser'
			
			constraints {
				// apply constraints here
			}
		}
		
		name battleGame: "/battle"{
			controller = 'game'
			action = 'index'
		}
		
		name playGame: "/play"{
			controller = 'rogueMek'
			action = 'index'
		}
		
		"/"(view:"/index")
        "500"(view:'/error')
	}
}
