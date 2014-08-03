<%@ page import="roguemek.User" %>



<div class="fieldcontain ${hasErrors(bean: userInstance, field: 'login', 'error')} required">
	<label for="login">
		<g:message code="user.login.label" default="Login" />
		<span class="required-indicator">*</span>
	</label>
	<g:field type="email" name="login" required="" value="${userInstance?.login}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: userInstance, field: 'callsign', 'error')} required">
	<label for="callsign">
		<g:message code="user.callsign.label" default="Callsign" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="callsign" maxlength="32" pattern="${userInstance.constraints.callsign.matches}" required="" value="${userInstance?.callsign}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: userInstance, field: 'password', 'error')} required">
	<label for="password">
		<g:message code="user.password.label" default="Password" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="password" maxlength="32" pattern="${userInstance.constraints.password.matches}" required="" value="${userInstance?.password}"/>

</div>

