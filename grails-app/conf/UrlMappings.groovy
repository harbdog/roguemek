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
		
		name dropship: "/dropship"{
			controller = 'rogueMek'
			action = 'index'
		}
		
		name stagingGame: "/staging/$id"{
			controller='rogueMek'
			action = 'staging'
		}
		
		name stagingMapSelect: "/staging/mapSelect"{
			controller='rogueMek'
			action='mapSelect'
		}
		
		name stagingMapUpdate: "/staging/mapUpdate"{
			controller='rogueMek'
			action='mapUpdate'
		}
		
		name startGame: "/startBattle"{
			controller = 'rogueMek'
			action = 'startBattle'
		}
		
		name battleGame: "/battle"{
			controller = 'game'
			action = 'index'
		}
		
		name debriefGame: "/debrief/$id"{
			controller = 'rogueMek'
			action = 'debrief'
		}
		
		name abortGame: "/abort/$id"{
			controller = 'rogueMek'
			action = 'abort'
		}
		
		"/"(view:"/index")
        "500"(view:'/error')
	}
}
