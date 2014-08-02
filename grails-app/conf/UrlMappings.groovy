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

        "/"(controller:"RogueMek")
        "500"(view:'/error')
	}
}
