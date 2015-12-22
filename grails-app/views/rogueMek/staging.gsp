<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<asset:stylesheet src="staging.css"/>
		<asset:javascript src="staging.js"/>
		<title><g:message code="game.init.staging.label" /></title>
	</head>
	<body>
	
		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="game.init.staging.label" /> - ${gameInstance?.description}</h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			
			<ol class="property-list game">
			
				<li class="fieldcontain">
					<span id="owner-label" class="property-label"><g:message code="owner.label" default="Owner" /></span>
					
					<g:if test="${gameInstance?.ownerUser == userInstance}">
						<span class="property-value" aria-labelledby="owner-label"><g:message code="you.label" default="You" /></span>
					</g:if>
					<g:else>
						<span class="property-value" aria-labelledby="owner-label">${gameInstance?.ownerUser}</span>
					</g:else>
				</li>
			
				<g:if test="${gameInstance?.isInit()}">
					<g:if test="${gameInstance?.board?.name() != null}">
						<g:set var="mapName" value="${gameInstance?.board?.name()}" />
					</g:if>
					<g:else>
						<g:set var="mapName" value="${g.message(code: 'default.button.random.label')}" />
					</g:else>
					
					<li class="fieldcontain">
						<span id="map-label" class="property-label"><g:message code="map.label" default="Map" /></span>
						
							<span id="map-button" aria-labelledby="map-label">${mapName}</span>
					</li>
				
					<g:each in="${gameInstance?.getUnitsByUser()}" var="entry">
						<g:set var="user" value="${entry.key}" />
	                	<g:set var="unitList" value="${entry.value}" /> 
	                	
	                	<li class="fieldcontain">
	                		<span id="users-label" class="property-label">${user.callsign}</span>
	                		
	                		<g:each in="${unitList}" var="unit">
	                			<g:set var="pilot" value="${unit.pilot}" />
	                			<span class="property-value" aria-labelledby="users-label">${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}</span>
	                		</g:each>
	                	</li>
	                </g:each>
				</g:if>
				<g:else>
					<li class="fieldcontain">
						<span id="map-label" class="property-label"><g:message code="map.label" default="Map" /></span>
						
							<span class="property-value" aria-labelledby="map-label">${gameInstance?.board?.name()}</span>
					</li>
					
					<li class="fieldcontain">
						<span id="turn-label" class="property-label"><g:message code="turn.label" default="Turn" /></span>
						
							<span class="property-value" aria-labelledby="turn-label">${gameInstance?.gameTurn+1}</span>
					</li>
					
					<li class="fieldcontain">
						<span id="update-label" class="property-label"><g:message code="last.update.label" default="Last Update" /></span>
						
							<span class="property-value" aria-labelledby="update-label"><g:formatDate date="${gameInstance?.updateDate}"/></span>
					</li>
					
					<g:each in="${gameInstance?.getUnitsByUser()}" var="entry">
						<g:set var="user" value="${entry.key}" />
	                	<g:set var="unitList" value="${entry.value}" /> 
	                	
	                	<li class="fieldcontain">
	                		<span id="users-label" class="property-label">${user.callsign}</span>
	                		
	                		<g:each in="${unitList}" var="unit">
	                			<g:set var="pilot" value="${unit.pilot}" />
	                			<span class="property-value" aria-labelledby="users-label">${unit.getHealthPercentage().round()}% : ${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}</span>
	                		</g:each>
	                	</li>
	                </g:each>
				</g:else>
				
			</ol>
		</div>
		
		<div class="buttons">
			<g:if test="${gameInstance?.ownerUser == userInstance && gameInstance?.isInit()}">
				<span class="left"><link:startGame game="${gameInstance?.id}"><g:message code="default.button.init.battle.label" /></link:startGame></span>
				<span class="right"><link:abortGame id="${gameInstance?.id}"><g:message code="default.button.abort.label" /></link:abortGame></span>
			</g:if>
			<g:else>
				<span class="left"><link:startGame game="${gameInstance?.id}"><g:message code="default.button.launch.label" /></link:startGame></span>
				<span class="right"><link:dropship><g:message code="default.button.leave.label" /></link:dropship></span>
			</g:else>
		</div>
	</body>
</html>
