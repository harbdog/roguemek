
<%@ page import="roguemek.game.Game" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<title><g:message code="game.over.debriefing.label" /></title>
	</head>
	<body>
		<a href="#show-game" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
			</ul>
		</div>
		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="game.over.debriefing.label" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list game">
			
				<g:if test="${gameInstance?.gameState}">
				<li class="fieldcontain">
					<span id="gameState-label" class="property-label"><g:message code="game.gameState.label" default="Game State" /></span>
					
						<span class="property-value" aria-labelledby="gameState-label"><g:fieldValue bean="${gameInstance}" field="gameState"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${gameInstance?.pilots}">
				<li class="fieldcontain">
					<span id="pilots-label" class="property-label"><g:message code="game.pilots.label" default="Pilots" /></span>
					
						<g:each in="${gameInstance.pilots}" var="p">
						<span class="property-value" aria-labelledby="pilots-label"><g:link controller="pilot" action="show" id="${p.id}">${p?.encodeAsHTML()}</g:link></span>
						</g:each>
					
				</li>
				</g:if>
				
				<g:if test="${gameInstance?.units}">
					<li class="fieldcontain">
						<span id="units-label" class="property-label"><g:message code="game.units.label" default="Units" /></span>
						
							<g:each in="${gameInstance.units}" var="u">
							<span class="property-value" aria-labelledby="units-label"><g:link controller="battleMech" action="show" id="${u.id}">${u?.encodeAsHTML()}</g:link></span>
							</g:each>
						
					</li>
				</g:if>
			
				<g:if test="${gameInstance?.startDate}">
				<li class="fieldcontain">
					<span id="startDate-label" class="property-label"><g:message code="game.startDate.label" default="Start Date" /></span>
					
						<span class="property-value" aria-labelledby="startDate-label"><g:formatDate date="${gameInstance?.startDate}" /></span>
					
				</li>
				</g:if>
			
				<g:if test="${gameInstance?.updateDate}">
				<li class="fieldcontain">
					<span id="updateDate-label" class="property-label"><g:message code="game.updateDate.label" default="Update Date" /></span>
					
						<span class="property-value" aria-labelledby="updateDate-label"><g:formatDate date="${gameInstance?.updateDate}" /></span>
					
				</li>
				</g:if>
			
			</ol>
		</div>
	</body>
</html>
