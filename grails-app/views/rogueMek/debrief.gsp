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
		def killMap = [:]	// [key: MekUser, value: [KillDeath,...],...]
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
		
		// load a map for easy access to the info by user
		def killsDeaths = KillDeath.findAllByGame(gameInstance)
		killsDeaths.each { KillDeath thisKD ->
			def killList = killMap[thisKD.killer]
			if(killList == null) {
				killList = []
				killMap[thisKD.killer] = killList
			}
			
			killList << thisKD
		}
		
		// load chat messages
		def chatMessages = ChatMessage.findAllByOptGameId(gameInstance?.id, [sort: "time", order: "asc"])
		
	 %>
		
		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="game.over.debriefing.label" /> - ${gameInstance?.description}</h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			
			<ol class="property-list game">
			
				<g:each in="${sortedUsers}" var="user">
				
					<h3>
						${user.callsign}
						<g:if test="${winners.contains(user)}">
							<span class="just-icon ui-icon ui-icon-star"></span>
						</g:if>
					</h3>
				
                	<g:set var="unitList" value="${unitsByUser[user]}" /> 
                	
                	<li class="fieldcontain">
                		<span id="units-label" class="property-label"><g:message code="game.status.label" default="Status" /></span>
                		
                		<g:each in="${unitList}" var="unit">
                			<g:set var="pilot" value="${unit.pilot}" />
                			<span class="property-value" aria-labelledby="units-label">
                				${unit.getHealthPercentage().round()}% : ${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}
               				</span>
                		</g:each>
                	</li>
                	
                	<g:if test="${killMap[user]}">
	                	<li class="fieldcontain">
	                		<span id="kills-label" class="property-label"><g:message code="game.kill.label" default="Kills" /></span>
	                		
	                		<g:each in="${killMap[user]}" var="thisKD">
	                			<span class="property-value" aria-labelledby="kills-label">
	                				${thisKD.victimUnit} (${thisKD.victim})
	               				</span>
	                		</g:each>
	                	</li>
                	</g:if>
                </g:each>
			
			</ol>
		</div>
		
		<div id="chat-area" class="content">
			<h1><g:message code="game.battle.log.label" default="Combat Log" /></h1>
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
		</div>
	</body>
</html>
