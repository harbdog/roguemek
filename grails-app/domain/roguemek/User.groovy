package roguemek

class User {
	String login
	String password
	String callsign
	
	//static hasMany = [ownedMechs:Mech]

    static constraints = {
		// login should have constraints to being the email
		login blank:false, unique:true
		password blank:false, size:5..20, matches:/[\S]+/
		callsign blank:false, unique:true
    }
}
