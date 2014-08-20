
<%@ page import="roguemek.game.BattleMech" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'battleMech.label', default: 'BattleMech')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-battleMech" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="index"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-battleMech" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list battleMech">
			
				<g:if test="${battleMechInstance?.mech}">
				<li class="fieldcontain">
					<span id="mech-label" class="property-label"><g:message code="battleMech.mech.label" default="Mech" /></span>
					
						<span class="property-value" aria-labelledby="mech-label"><g:link controller="mech" action="show" id="${battleMechInstance?.mech?.id}">${battleMechInstance?.mech?.name +" "+battleMechInstance?.mech?.chassis+"-"+battleMechInstance?.mech?.variant}</g:link></span>
					
				</li>
				</g:if>
			
				<g:if test="${battleMechInstance?.ownerPilot}">
				<li class="fieldcontain">
					<span id="ownerPilot-label" class="property-label"><g:message code="battleMech.ownerPilot.label" default="Owner Pilot" /></span>
					
						<span class="property-value" aria-labelledby="ownerPilot-label"><g:link controller="pilot" action="show" id="${battleMechInstance?.ownerPilot?.id}">${battleMechInstance?.ownerPilot?.firstName +" \""+battleMechInstance?.ownerPilot?.ownerUser?.callsign+"\" "+battleMechInstance?.ownerPilot?.lastName}</g:link></span>
					
				</li>
				</g:if>
			
			</ol>
			<g:form url="[resource:battleMechInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:link class="edit" action="edit" resource="${battleMechInstance}"><g:message code="default.button.edit.label" default="Edit" /></g:link>
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
