package roguemek

import roguemek.game.Pilot;

class User {

	transient springSecurityService

	String username
	String callsign
	String password
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
	}

	def beforeUpdate() {
		if (isDirty('password')) {
			encodePassword()
		}
	}

	protected void encodePassword() {
		password = springSecurityService?.passwordEncoder ? springSecurityService.encodePassword(password) : password
	}
	
	@Override
	public String toString() {
		return callsign
	}
}
