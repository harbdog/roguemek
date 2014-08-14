package mek.command

import roguemek.User;

@grails.validation.Validateable
class LoginCommand {
	
	String login
	String password
	private u

    static constraints = {
		login blank:false, validator:{ val, obj ->
			if(!obj.user) {
				return "user.not.found"
			}
			
		}
		
		password blank:false, validator:{ val, obj ->
			if(obj.user && obj.user.password != val) {
				return "user.password.invalid"
			}
		}
    }
	
	User getUser() {
		if(!u && login) {
			u = User.findByLogin(login)
		}
		
		return u
	}
}
