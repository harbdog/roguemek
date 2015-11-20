
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
			
				<g:if test="${gameInstance?.startDate}">
				<li class="fieldcontain">
					<span id="startDate-label" class="property-label"><g:message code="game.startDate.label" default="Start Date" /></span>
					
						<span class="property-value" aria-labelledby="startDate-label"><g:formatDate date="${gameInstance?.startDate}" /></span>
					
				</li>
				</g:if>
			
				<g:if test="${gameInstance?.updateDate}">
				<li class="fieldcontain">
					<span id="updateDate-label" class="property-label"><g:message code="game.endDate.label" default="End Date" /></span>
					
						<span class="property-value" aria-labelledby="updateDate-label"><g:formatDate date="${gameInstance?.updateDate}" /></span>
					
				</li>
				</g:if>
			
			</ol>
		</div>
	</body>
</html>
