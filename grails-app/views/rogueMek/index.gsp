<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="main">
		<title>RogueMek</title>
	</head>
	<body id="body">
		<div id="show-user" class="content scaffold-show" role="main">
			<h1>Select a game to play</h1>
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
						<%
							// TODO: The findByPilots query was failing, so doing it the dumb way just to get past, fix it later?
							def gameList = Game.getAll()
							def g = null
							gameList.each { thisGame ->
								if(thisGame.pilots?.contains(p)){
									g = thisGame
									return
								}
							}
						%>
							<g:if test="${g}">
								<span class="property-value" aria-labelledby="pilots-label"><g:link action="playGame" params='[game:"${g.id}", pilot:"${p.id}"]'>${p?.firstName+" "+p?.lastName} - Game ID:${g.id}</g:link></span>
							</g:if>
						</g:each>
					
				</li>
				</g:if>
			
			</ol>
		</div>
	</body>
</html>