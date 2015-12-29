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
		<div id="mapSelectDiv"></div>
		<div id="loadingDiv"><div id="spinner" class="spinner"><g:message code="spinner.alt" default="Loading&hellip;"/></div></div>
	
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
					<%-- store the selected HexMap ID where the javascript can get to it later --%>
					<g:if test="${gameInstance?.board?.mapId()}">
						<script type="text/javascript">var selectedMapId = "${gameInstance?.board?.mapId()}";</script>
					</g:if>
					<g:else>
						<script type="text/javascript">var selectedMapId = null;</script>
					</g:else>
				
					<g:if test="${gameInstance?.board?.name() != null}">
						<g:set var="mapName" value="${gameInstance?.board?.toString()}" />
					</g:if>
					<g:else>
						<g:set var="mapName" value="${g.message(code: 'default.button.random.label')}" />
					</g:else>
					
					<li class="fieldcontain">
						<span id="map-label" class="property-label"><g:message code="map.label" default="Map" /></span>
						
						<g:if test="${gameInstance?.ownerUser == userInstance}">
							<button id="map-button" aria-labelledby="map-label">${mapName}</button>
						</g:if>
						<g:else>
							<span class="property-value" aria-labelledby="map-label">${mapName}</span>
						</g:else>
					</li>
				</g:if>
				<g:else>
					<li class="fieldcontain">
						<span id="map-label" class="property-label"><g:message code="map.label" default="Map" /></span>
						
							<span class="property-value" aria-labelledby="map-label">${gameInstance?.board?.toString()}</span>
					</li>
					
					<li class="fieldcontain">
						<span id="turn-label" class="property-label"><g:message code="turn.label" default="Turn" /></span>
						
							<span class="property-value" aria-labelledby="turn-label">${gameInstance?.gameTurn+1}</span>
					</li>
					
					<li class="fieldcontain">
						<span id="update-label" class="property-label"><g:message code="last.update.label" default="Last Update" /></span>
						
							<span class="property-value" aria-labelledby="update-label"><g:formatDate date="${gameInstance?.updateDate}"/></span>
					</li>
				</g:else>
				
			</ol>
		</div>
		
		<div id="teams">
			<g:set var="isEditable" value="${gameInstance?.ownerUser == userInstance && gameInstance?.isInit()}" />
			<script type="text/javascript">var playersEditable = ${isEditable};</script>
			
			<g:each in="${gameInstance?.users}" var="thisUser">
				<div class="team">
					<h2>Team ${thisUser}</h2>
					
					<g:render template="stagePlayer" bean="${thisUser}" var="user" />
				</div>
			</g:each>
		</div>
			
		<div class="buttons">
			<g:if test="${gameInstance?.ownerUser == userInstance && gameInstance?.isInit()}">
				<span class="left"><link:startGame game="${gameInstance?.id}"><g:message code="default.button.init.battle.label" /></link:startGame></span>
				
				<span class="right"><link:abortGame id="${gameInstance?.id}"><g:message code="default.button.abort.label" /></link:abortGame></span>
			</g:if>
			<g:else>
				<g:if test="${gameInstance?.isActive()}">
					<span class="left"><link:startGame game="${gameInstance?.id}"><g:message code="default.button.launch.label" /></link:startGame></span>
				</g:if>
				<g:else>
					<%-- For now, just a link just to refresh page --%>
					<span class="left"><link:stagingGame id="${gameInstance?.id}"><g:message code="default.button.refresh.label" /></link:stagingGame></span>
				</g:else>
				
				<span class="right"><link:dropship><g:message code="default.button.leave.label" /></link:dropship></span>
			</g:else>
		</div>
	</body>
</html>
