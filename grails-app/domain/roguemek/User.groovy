package roguemek

import roguemek.game.Pilot;

class User {
	private static final Date NULL_DATE = new Date(0)

	transient springSecurityService

	String username
	String callsign
	String password
	Date signupDate = NULL_DATE
	Date lastLoginDate = NULL_DATE
	boolean enabled = true
	boolean accountExpired
	boolean accountLocked
	boolean passwordExpired
	
	static hasMany = [pilots:Pilot]

	static transients = ['springSecurityService']

	static constraints = {
		username email:true, unique:true
		callsign blank: false, unique: true
		password blank: false
	}

	static mapping = {
		password column: '`password`'
	}

	Set<Role> getAuthorities() {
		UserRole.findAllByUser(this).collect { it.role }
	}
	
	def beforeInsert() {
		encodePassword()
		
		if (signupDate == NULL_DATE) {
			signupDate = new Date()
		}
	}

	def beforeUpdate() {
		if (isDirty('password')) {
			encodePassword()
		}
	}

	protected void encodePassword() {
		password = springSecurityService?.passwordEncoder ? springSecurityService.encodePassword(password) : password
	}
	
	static void updateLastLogin(def id) {
		if(id != null){
			def user = User.get(id)
			user.lastLoginDate = new Date()
			user.save(flush: true, failOnError: true)
		}
	}
	
	@Override
	public String toString() {
		return callsign
	}
}
