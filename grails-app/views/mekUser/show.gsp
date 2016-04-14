
<%@ page import="roguemek.MekUser" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'user.label', default: 'User')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-user" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="index"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-user" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list user">
			
				<g:if test="${mekUserInstance?.username}">
				<li class="fieldcontain">
					<span id="username-label" class="property-label"><g:message code="user.email.label" default="Email" /></span>
					
						<span class="property-value" aria-labelledby="username-label"><g:fieldValue bean="${mekUserInstance}" field="username"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mekUserInstance?.callsign}">
				<li class="fieldcontain">
					<span id="callsign-label" class="property-label"><g:message code="user.callsign.label" default="Callsign" /></span>
					
						<span class="property-value" aria-labelledby="callsign-label"><g:fieldValue bean="${mekUserInstance}" field="callsign"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mekUserInstance?.password}">
				<li class="fieldcontain">
					<span id="password-label" class="property-label"><g:message code="user.password.label" default="Password" /></span>
					
						<span class="property-value" aria-labelledby="password-label">*******</span>
					
				</li>
				</g:if>
				
				<g:if test="${!mekUserInstance?.enabled && mekUserInstance?.confirmCode}">
				<li class="fieldcontain">
					<span id="confirmCode-label" class="property-label"><g:message code="user.confirm.label" default="Confirm" /></span>
					
						<span class="property-value" aria-labelledby="confirmCode-label"><g:createLink absolute="true" controller="mekUser" action="confirm" id="${mekUserInstance?.confirmCode}"></g:createLink></span>
					
				</li>
				</g:if>
				
				<li class="fieldcontain">
					<span id="accountLocked-label" class="property-label"><g:message code="user.accountLocked.label" default="Account Locked" /></span>
					
						<span class="property-value" aria-labelledby="accountLocked-label"><g:formatBoolean boolean="${mekUserInstance?.accountLocked}" /></span>
					
				</li>
				
				<li class="fieldcontain">
					<span id="enabled-label" class="property-label"><g:message code="user.enabled.label" default="Enabled" /></span>
					
						<span class="property-value" aria-labelledby="enabled-label"><g:formatBoolean boolean="${mekUserInstance?.enabled}" /></span>
					
				</li>
				
				<g:if test="${mekUserInstance?.signupDate}">
					<li class="fieldcontain">
						<span id="signup-label" class="property-label"><g:message code="user.signup.label" default="Registered" /></span>
						
							<span class="property-value" aria-labelledby="signup-label"><g:formatDate format="yyyy-MM-dd" date="${mekUserInstance.signupDate}"/></span>
						
					</li>
				</g:if>
				
				<g:if test="${mekUserInstance?.lastLoginDate}">
					<li class="fieldcontain">
						<span id="lastlogin-label" class="property-label"><g:message code="user.lastlogin.label" default="Last Login" /></span>
						
							<span class="property-value" aria-labelledby="lastlogin-label"><g:formatDate date="${mekUserInstance.lastLoginDate}"/></span>
						
					</li>
				</g:if>
				
				<sec:ifAnyGranted roles="ROLE_ROOT">
					<li class="fieldcontain">
						<span id="country-label" class="property-label"><g:message code="user.country.label" default="Country" /></span>
						
							<span class="property-value" aria-labelledby="country-label">${mekUserInstance.country}</span>
						
					</li>
				</sec:ifAnyGranted>
			
			</ol>
			<g:form url="[resource:mekUserInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:link class="edit" action="edit" resource="${mekUserInstance}"><g:message code="default.button.edit.label" default="Edit" /></g:link>
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
