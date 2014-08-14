package roguemek

class User {
	String login
	String callsign
	String password
	
	//static hasMany = [ownedMechs:Mech]
	
	def bcryptService

    static constraints = {
		// login should have constraints to being the email
		login email:true, unique:true
		callsign blank:false, size:3..32, matches:/[\S]+/, unique:true
		password blank:false
    }
	
	public Boolean checkPassword(String chkPassword) {
		return bcryptService.checkPassword(chkPassword, this.password)
	}
}
