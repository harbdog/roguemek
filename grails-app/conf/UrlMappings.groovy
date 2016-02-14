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
		
		name register: "/register"{
			controller = 'mekUser'
			action = 'register'
		}
		
		name confirm: "/confirm"{
			controller = 'mekUser'
			action = 'confirm'
		}
		
		name forgotPassword: "/forgotPassword"{
			controller = 'mekUser'
			action = 'forgotPassword'
		}
		
		name resetPassword: "/resetPassword"{
			controller = 'mekUser'
			action = 'resetPassword'
		}
		
		name updatePassword: "/updatePassword"{
			controller = 'mekUser'
			action = 'updatePassword'
		}
		
		name success: "/success"{
			controller = 'mekUser'
			action = 'success'
		}
		
		name dropship: "/dropship"{
			controller = 'rogueMek'
			action = 'index'
		}
		
		name stagingGame: "/staging/$id"{
			controller='rogueMek'
			action = 'staging'
		}
		
		group "/staging", {
			"/mapSelect" (controller:'rogueMek', action:'mapSelect')
			"/mapUpdate" (controller:'rogueMek', action:'mapUpdate')
			"/unitSelect" (controller:'rogueMek', action:'unitSelect')
			"/stageUnit" (controller:'rogueMek', action:'stageUnit')
			"/addUnit" (controller:'rogueMek', action:'addUnit')
			"/removeUnit" (controller:'rogueMek', action:'removeUnit')
			"/stageUser" (controller:'rogueMek', action:'stageUser')
			"/addUser" (controller:'rogueMek', action:'addUser')
			"/removeUser" (controller:'rogueMek', action:'removeUser')
			"/locationUpdate" (controller:'rogueMek', action:'locationUpdate')
			"/camoSelect" (controller:'rogueMek', action:'camoSelect')
			"/camoUpdate" (controller:'rogueMek', action:'camoUpdate')
			"/camoApply" (controller:'rogueMek', action:'camoApply')
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
