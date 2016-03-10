<%@ page import="roguemek.game.Game"
		 import="roguemek.game.BattleMech"
		 import="roguemek.stats.WinLoss"
		 import="roguemek.stats.KillDeath" 
		 import="roguemek.chat.ChatMessage"
 %>

<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<asset:stylesheet src="debrief.css"/>
		<asset:javascript src="debrief.js"/>
		<title><g:message code="game.over.debriefing.label" /></title>
	</head>
	<body>
	
	<%
		// load some tables and maps to help display the game result data
		def winners = []
		def sortedUsers = []
		def killMap = [:]	// key: Unit, value: [Unit,...]
		def deathMap = [:]	// key: Unit, value: Unit
		def unitsByUser = gameInstance?.getUnitsByUser()
		
		// show winners first on the page
		def winsLosses = WinLoss.findAllByGame(gameInstance)
		winsLosses.each { WinLoss thisWL ->
			if(thisWL.winner) {
				winners << thisWL.user
			}
			else {
				sortedUsers.add(thisWL.user)
			}
		}
		sortedUsers = (winners << sortedUsers).flatten()
		
		// load the kill map
		def killsDeaths = KillDeath.findAllByGame(gameInstance)
		killsDeaths.each { KillDeath thisKD ->
			if(thisKD.killerUnit != null) {
				// note the death
				deathMap[thisKD.victimUnit] = thisKD.killerUnit
				
				// note the kill
				def unitKills = killMap[thisKD.killerUnit]
				if(unitKills == null) {
					unitKills = []
					killMap[thisKD.killerUnit] = unitKills
				}
				
				unitKills << thisKD.victimUnit
			}
			else {
				// note the death
				deathMap[thisKD.victimUnit] = thisKD.victimUnit
			}
		}
		
		// load chat messages
		def chatMessages = ChatMessage.findAllByOptGameId(gameInstance?.id, [sort: "time", order: "asc"])
		
	 %>
	
		<%-- using atmosphere meteor for chat --%>
		<div id="chat-area">
			<div id="chat-window">
				<%-- show previous chat from database --%>
				<g:if test="${chatMessages}">
					<g:each in="${chatMessages}" var="thisChat">
						<div class="chat-line">
							<%-- TODO: figure out showing in the locale time style like Date.toLocaleTimeString in javascript --%>
							<span class="chat-time">[<g:formatDate format="h:mm:ss a" date="${thisChat.time}"/>]</span>
							<g:if test="${thisChat.user}"><span class="chat-user">${thisChat.user}:</span></g:if>
							<span class="chat-message">${thisChat.message}</span>
						</div>
					</g:each>
				</g:if>
			</div>
			<input id="chat-input" type="text"/>
		</div>
	
		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="game.over.debriefing.label" /> - ${gameInstance?.description}</h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list game">
			
				<g:each in="${sortedUsers}" var="user">
                	<g:set var="unitList" value="${unitsByUser[user]}" /> 
                	
                	<li class="fieldcontain">
                		<span id="users-label" class="property-label">${user.callsign}</span>
                		
                		<g:each in="${unitList}" var="unit">
                			<g:set var="pilot" value="${unit.pilot}" />
                			<span class="property-value" aria-labelledby="users-label">
                				${unit.getHealthPercentage().round()}% : ${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}
                				<g:if test="${unit instanceof BattleMech && deathMap[unit.mech]}">
                					- Killed by ${deathMap[unit.mech]}
                				</g:if>
                				<g:if test="${unit instanceof BattleMech && killMap[unit.mech]}">
                					(Kills: ${killMap[unit.mech].size()})
                				</g:if>
               				</span>
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
