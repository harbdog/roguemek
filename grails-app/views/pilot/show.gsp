
<%@ page import="roguemek.model.Pilot" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'pilot.label', default: 'Pilot')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-pilot" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="index"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-pilot" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list pilot">
			
				<g:if test="${pilotInstance?.firstName}">
				<li class="fieldcontain">
					<span id="firstName-label" class="property-label"><g:message code="pilot.firstName.label" default="First Name" /></span>
					
						<span class="property-value" aria-labelledby="firstName-label"><g:fieldValue bean="${pilotInstance}" field="firstName"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${pilotInstance?.lastName}">
				<li class="fieldcontain">
					<span id="lastName-label" class="property-label"><g:message code="pilot.lastName.label" default="Last Name" /></span>
					
						<span class="property-value" aria-labelledby="lastName-label"><g:fieldValue bean="${pilotInstance}" field="lastName"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${pilotInstance?.status}">
				<li class="fieldcontain">
					<span id="status-label" class="property-label"><g:message code="pilot.status.label" default="Status" /></span>
					
						<span class="property-value" aria-labelledby="status-label"><g:fieldValue bean="${pilotInstance}" field="status"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${pilotInstance?.ownerUser}">
				<li class="fieldcontain">
					<span id="ownerUser-label" class="property-label"><g:message code="pilot.ownerUser.label" default="Owner User" /></span>
					
						<span class="property-value" aria-labelledby="ownerUser-label"><g:link controller="user" action="show" id="${pilotInstance?.ownerUser?.id}">${pilotInstance?.ownerUser?.username}</g:link></span>
					
				</li>
				</g:if>
			
				<g:if test="${pilotInstance?.ownedMechs}">
				<li class="fieldcontain">
					<span id="ownedMechs-label" class="property-label"><g:message code="pilot.ownedMechs.label" default="Owned Mechs" /></span>
					
						<g:each in="${pilotInstance.ownedMechs}" var="o">
						<span class="property-value" aria-labelledby="ownedMechs-label"><g:link controller="battleMech" action="show" id="${o.id}">${o?.mech?.name +" " + o?.mech?.chassis+"-"+o?.mech?.variant}</g:link></span>
						</g:each>
					
				</li>
				</g:if>
			
			</ol>
			<g:form url="[resource:pilotInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:link class="edit" action="edit" resource="${pilotInstance}"><g:message code="default.button.edit.label" default="Edit" /></g:link>
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
