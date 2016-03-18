
<%@ page import="roguemek.MekUser" 
		 import="roguemek.stats.KillDeath"
		 import="roguemek.stats.WinLoss"
%>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'user.label', default: 'User')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
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
			
				<g:if test="${mekUserInstance?.signupDate}">
					<li class="fieldcontain">
						<span id="signup-label" class="property-label"><g:message code="user.signup.label" default="Registered" /></span>
						
							<span class="property-value" aria-labelledby="signup-label"><g:formatDate format="yyyy-MM-dd" date="${mekUserInstance.signupDate}"/></span>
						
					</li>
				</g:if>
				
				<g:if test="${mekUserInstance?.lastLoginDate}">
					<li class="fieldcontain">
						<span id="lastlogin-label" class="property-label"><g:message code="user.lastlogin.label" default="Last Login" /></span>
						
							<span class="property-value" aria-labelledby="lastlogin-label"><g:formatDate date="${mekUserInstance.lastLoginDate}"/></span>
						
					</li>
				</g:if>
			
			</ol>
			
			<%
				def winLossList = WinLoss.findAllByUser(mekUserInstance, [sort: "time", order: "desc"])
			%>
			<g:if test="${winLossList?.size()}">
			<div id="winloss">
				<h1><g:message code="user.winloss.label" default="Win/Loss" /></h1>
				<ol class="property-list">
				<g:each in="${winLossList}" var="thisWL">
					<li class="fieldcontain">
					<g:if test="${thisWL.winner}">
						<span class="property-label"><span class="just-icon ui-icon ui-icon-star"></span><g:formatDate date="${thisWL.time}"/></span>
						<span class="property-value"><g:message code="game.won.label" /><span class="just-icon ui-icon ui-icon-blank"></span><link:debriefGame id="${thisWL.game?.id}">${thisWL.game?.description}</link:debriefGame></span>
					</g:if>
					<g:else>
						<span class="property-label"><span class="just-icon ui-icon ui-icon-blank"></span><g:formatDate date="${thisWL.time}"/></span>
						<span class="property-value"><g:message code="game.lost.label" /><span class="just-icon ui-icon ui-icon-blank"></span><link:debriefGame id="${thisWL.game?.id}">${thisWL.game?.description}</link:debriefGame></span>
					</g:else>
					</li>
				</g:each>
				</ol>
			</div>
			</g:if>
			
			<%
				def killDeathCriteria = KillDeath.createCriteria()
				def killDeathList = killDeathCriteria.list {
					or {
						eq("killer", mekUserInstance)
						eq("victim", mekUserInstance)
					}
					order("time", "desc")
				}
			%>
			<g:if test="${killDeathList?.size()}">
			<div id="killdeath">
				<h1><g:message code="user.killdeath.label" default="Kill/Death" /></h1>
				<ol class="property-list">
				<g:each in="${killDeathList}" var="thisKD">
					<li class="fieldcontain">
					<g:if test="${thisKD.killer == mekUserInstance}">
						<g:set var="victimDesc" value="${thisKD.victimUnit} (${thisKD.victim?.callsign})" />
					
						<span class="property-label"><span class="just-icon ui-icon ui-icon-bullet"></span><g:formatDate date="${thisKD.time}"/></span>
						<span class="property-value"><g:message code="game.killed.label" args="[thisKD.killerUnit, victimDesc]"/><span class="just-icon ui-icon ui-icon-blank"></span></span>
					</g:if>
					<g:else>
						<g:if test="${thisKD.killer != null}">
							<g:set var="killerDesc" value="${thisKD.killerUnit} (${thisKD.killer?.callsign})" />
						</g:if>
						<g:else>
							<g:set var="killerDesc" value="${message(code: 'game.self.label', default: 'Self')}" />
						</g:else>
					
						<span class="property-label"><span class="just-icon ui-icon ui-icon-radio-off"></span><g:formatDate date="${thisKD.time}"/></span>
						<span class="property-value"><g:message code="game.killedby.label" args="[thisKD.victimUnit, killerDesc]"/><span class="just-icon ui-icon ui-icon-blank"></span></span>
					</g:else>
					</li>
				</g:each>
				</ol>
			</div>
			</g:if>
		</div>
	</body>
</html>
