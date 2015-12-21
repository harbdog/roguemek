<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<title><g:message code="game.init.staging.label" /></title>
	</head>
	<body>
	
		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="game.init.staging.label" /> - ${gameInstance?.description}</h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list game">
			
				<g:each in="${gameInstance?.getUnitsByUser()}" var="entry">
					<g:set var="user" value="${entry.key}" />
                	<g:set var="unitList" value="${entry.value}" /> 
                	
                	<li class="fieldcontain">
                		<span id="users-label" class="property-label">${user.callsign}</span>
                		
                		<g:each in="${unitList}" var="unit">
                			<g:set var="pilot" value="${unit.pilot}" />
                			<span class="property-value" aria-labelledby="users-label">${unit.getHealthPercentage().round()}% : <g:link controller="battleMech" action="show" id="${unit.id}">${unit?.encodeAsHTML()}</g:link> - <g:link controller="pilot" action="show" id="${pilot.id}">${pilot?.encodeAsHTML()}</g:link></span>
                		</g:each>
                	</li>
                </g:each>
			</ol>
		</div>
		
		<div class="buttons">
			<span class="left"><link:startGame game="${gameInstance.id}"><g:message code="default.button.launch.label" /></link:startGame></span>
			
			<g:if test="${gameInstance.ownerUser == userInstance}">
				<span class="right"><link:abortGame id="${gameInstance.id}"><g:message code="default.button.abort.label" /></link:abortGame></span>
			</g:if>
			<g:else>
				<span class="right"><link:dropship><g:message code="default.button.leave.label" /></link:dropship></span>
			</g:else>
		</div>
	</body>
</html>
