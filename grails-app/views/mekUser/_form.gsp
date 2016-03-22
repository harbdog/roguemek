<%@ page import="roguemek.MekUser" %>



<div class="fieldcontain ${hasErrors(bean: mekUserInstance, field: 'username', 'error')} required">
	<label for="username">
		<g:message code="user.email.label" default="Email" />
		<span class="required-indicator">*</span>
	</label>
	<g:field type="email" name="username" required="" value="${mekUserInstance?.username}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: mekUserInstance, field: 'callsign', 'error')} required">
	<label for="callsign">
		<g:message code="user.callsign.label" default="Callsign" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="callsign" required="" value="${mekUserInstance?.callsign}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: mekUserInstance, field: 'password', 'error')} required">
	<label for="password">
		<g:message code="user.password.label" default="Password" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="password" required="" value="${mekUserInstance?.password}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: mekUserInstance, field: 'accountExpired', 'error')} ">
	<label for="accountExpired">
		<g:message code="user.accountExpired.label" default="Account Expired" />
		
	</label>
	<g:checkBox name="accountExpired" value="${mekUserInstance?.accountExpired}" />

</div>

<div class="fieldcontain ${hasErrors(bean: mekUserInstance, field: 'accountLocked', 'error')} ">
	<label for="accountLocked">
		<g:message code="user.accountLocked.label" default="Account Locked" />
		
	</label>
	<g:checkBox name="accountLocked" value="${mekUserInstance?.accountLocked}" />

</div>

<div class="fieldcontain ${hasErrors(bean: mekUserInstance, field: 'enabled', 'error')} ">
	<label for="enabled">
		<g:message code="user.enabled.label" default="Enabled" />
		
	</label>
	<g:checkBox name="enabled" value="${mekUserInstance?.enabled}" />

</div>

<%--
<div class="fieldcontain ${hasErrors(bean: mekUserInstance, field: 'passwordExpired', 'error')} ">
	<label for="passwordExpired">
		<g:message code="user.passwordExpired.label" default="Password Expired" />
		
	</label>
	<g:checkBox name="passwordExpired" value="${mekUserInstance?.passwordExpired}" />

</div>
--%>

