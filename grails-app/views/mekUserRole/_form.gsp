<%@ page import="roguemek.MekUserRole" %>



<div class="fieldcontain ${hasErrors(bean: userRoleInstance, field: 'role', 'error')} required">
	<label for="role">
		<g:message code="userRole.role.label" default="Role" />
		<span class="required-indicator">*</span>
	</label>
	<g:select id="role" name="role.id" from="${roguemek.Role.list()}" optionKey="id" required="" optionValue="authority" value="${userRoleInstance?.role?.id}" class="many-to-one"/>

</div>

<div class="fieldcontain ${hasErrors(bean: userRoleInstance, field: 'user', 'error')} required">
	<label for="user">
		<g:message code="userRole.user.label" default="User" />
		<span class="required-indicator">*</span>
	</label>
	<g:select id="user" name="user.id" from="${roguemek.MekUser.list()}" optionKey="id" required="" optionValue="username" value="${userRoleInstance?.user?.id}" class="many-to-one"/>

</div>

