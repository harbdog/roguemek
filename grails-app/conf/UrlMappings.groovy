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
		
		name userProfile: "/showProfile"{
			controller = 'mekUser'
			action = 'showUser'
		}
		
		name login: "/login"{
			controller = 'login'
			action = 'auth'
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
			controller='staging'
			action = 'staging'
		}
		
		name stagingAction: "/staging/$action"{
			controller='staging'
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
		
		name leaveGame: "/leave/$id"{
			controller = 'staging'
			action = 'leave'
		}
		
		name abortGame: "/abort/$id"{
			controller = 'rogueMek'
			action = 'abort'
		}
		
		"/"(view:"/index")
        "500"(view:'/error')
	}
}
