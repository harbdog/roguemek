
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
			</ul>
		</div>
		<div id="show-user" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list user">
			
				<g:if test="${mekUserInstance?.callsign}">
				<li class="fieldcontain">
					<span id="callsign-label" class="property-label"><g:message code="user.callsign.label" default="Callsign" /></span>
					
						<span class="property-value" aria-labelledby="callsign-label"><g:fieldValue bean="${mekUserInstance}" field="callsign"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mekUserInstance?.pilots}">
				<li class="fieldcontain">
					<span id="pilots-label" class="property-label"><g:message code="user.pilots.label" default="Pilots" /></span>
					
						<g:each in="${mekUserInstance.pilots}" var="p">
						<span class="property-value" aria-labelledby="pilots-label"><g:link controller="pilot" action="show" id="${p.id}">${p?.firstName+" "+p?.lastName}</g:link></span>
						</g:each>
					
				</li>
				</g:if>
			
			</ol>
		</div>
	</body>
</html>
