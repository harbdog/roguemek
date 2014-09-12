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
		
		name playGame: "/battle"{
			controller = 'game'
			action = 'index'
		}
		
		"/"(view:"/index")
        "500"(view:'/error')
	}
}
