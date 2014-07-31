package roguemek

class UserController {

    def register() {
		if(request.method == 'POST') {
			def u = new User()
			u.properties['login', 'password', 'callsign'] = params
			if(u.password != params.confirm) {
				u.errors.rejectValue("password", "user.password.dontmatch")
				return [user:u]
			}
			else if(u.save()) {
				session.user = u
				redirect controller:"RogueMek"
			}
			else {
				return [user:u]
			}
		}
	}
	
	def login(LoginCommand cmd) {
		if(request.method == 'POST') {
			if(!cmd.hasErrors()) {
				session.user = cmd.getUser()
				redirect controller:'RogueMek'
			}
			else {
				render view:'/RogueMek', model:[loginCmd:cmd]
			}
		}
		else {
			render view:'/RogueMek'
		}
	}
	
	def logout() {
		session.invalidate()
		redirect controller:'RogueMek'
	}
}
