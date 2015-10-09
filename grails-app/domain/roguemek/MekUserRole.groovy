package roguemek

import org.apache.commons.lang.builder.HashCodeBuilder

class MekUserRole implements Serializable {

	private static final long serialVersionUID = 1

	MekUser user
	Role role

	boolean equals(other) {
		if (!(other instanceof MekUserRole)) {
			return false
		}

		other.user?.id == user?.id &&
		other.role?.id == role?.id
	}

	int hashCode() {
		def builder = new HashCodeBuilder()
		if (user) builder.append(user.id)
		if (role) builder.append(role.id)
		builder.toHashCode()
	}

	static MekUserRole get(String userId, long roleId) {
		MekUserRole.where {
			user == MekUser.load(userId) &&
			role == Role.load(roleId)
		}.get()
	}

	static boolean exists(String userId, long roleId) {
		MekUserRole.where {
			user == MekUser.load(userId) &&
			role == Role.load(roleId)
		}.count() > 0
	}

	static MekUserRole create(MekUser user, Role role, boolean flush = false) {
		def instance = new MekUserRole(user: user, role: role)
		instance.save(flush: flush, insert: true)
		instance
	}

	static boolean remove(MekUser u, Role r, boolean flush = false) {
		if (u == null || r == null) return false

		int rowCount = MekUserRole.where {
			user == MekUser.load(u.id) &&
			role == Role.load(r.id)
		}.deleteAll()

		if (flush) { MekUserRole.withSession { it.flush() } }

		rowCount > 0
	}

	static void removeAll(MekUser u, boolean flush = false) {
		if (u == null) return

		MekUserRole.where {
			user == MekUser.load(u.id)
		}.deleteAll()

		if (flush) { MekUserRole.withSession { it.flush() } }
	}

	static void removeAll(Role r, boolean flush = false) {
		if (r == null) return

		MekUserRole.where {
			role == Role.load(r.id)
		}.deleteAll()

		if (flush) { MekUserRole.withSession { it.flush() } }
	}

	static constraints = {
		role validator: { Role r, MekUserRole ur ->
			if (ur.user == null) return
			boolean existing = false
			MekUserRole.withNewSession {
				existing = MekUserRole.exists(ur.user.id, r.id)
			}
			if (existing) {
				return 'userRole.exists'
			}
		}
	}

	static mapping = {
		id composite: ['role', 'user']
		version false
	}
}
