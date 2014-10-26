package roguemek

class Role {

	String authority
	
	public static final String ROLE_ROOT = 'ROLE_ROOT'
	public static final String ROLE_ADMIN = 'ROLE_ADMIN'
	public static final String ROLE_USER = 'ROLE_USER'

	static mapping = {
		cache true
	}

	static constraints = {
		authority blank: false, unique: true, inList: [ROLE_ROOT, ROLE_ADMIN, ROLE_USER]
	}
}
