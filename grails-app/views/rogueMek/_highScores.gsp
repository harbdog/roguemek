<%@ page 
	import="roguemek.MekUser"
	import="roguemek.game.Game"
	import="roguemek.stats.WinLoss"
	import="roguemek.stats.KillDeath"
%>

<%
	// load all high scores for wins and kills
	def topWinners = WinLoss.executeQuery(
		"SELECT w.user.id AS userid, w.user.callsign as callsign, count(*) AS wins FROM WinLoss w "
		+ "WHERE w.winner = true GROUP BY w.user.id, w.user.callsign ORDER BY wins desc",
		[:], [max: 10]
	)

	def topKillers = KillDeath.executeQuery(
		"SELECT k.killer.id AS userid, k.killer.callsign as callsign, count(*) AS kills FROM KillDeath k "
		+ "WHERE k.killer.id != k.victim.id GROUP BY k.killer.id, k.killer.callsign ORDER BY kills desc",
		[:], [max: 10]
	)

%>

<div class="highscores">
	<div class="top-winners">
		<h1><g:message code="high.score.top.winners" /></h1>
		<g:if test="${topWinners.size() == 0}">
			<li><g:message code="high.score.no.wins" /></li>
		</g:if>
		<ol>
		<g:each in="${topWinners}" status="i" var="thisWinnerRow">
			<g:set var="callsign" value="${thisWinnerRow[1]}" />
			<g:set var="wins" value="${thisWinnerRow[2]}" />
			<li>
				<span><g:link mapping="userDetails" params="[callsign: callsign]" fragment="winloss">${callsign}</g:link></span> - <span><g:message code="high.score.wins" args="[wins]" /></span>
			</li>
		</g:each>
		</ol>
	</div>
	
	<div class="top-killers">
		<h1><g:message code="high.score.top.killers" /></h1>
		<g:if test="${topKillers.size() == 0}">
			<li><g:message code="high.score.no.kills" /></li>
		</g:if>
		<ol>
		<g:each in="${topKillers}" status="i" var="thisKillerRow">
			<g:set var="callsign" value="${thisKillerRow[1]}" />
			<g:set var="kills" value="${thisKillerRow[2]}" />
			<li>
				<span><g:link mapping="userDetails" params="[callsign: callsign]" fragment="killdeath">${callsign}</g:link></span> - <span><g:message code="high.score.kills" args="[kills]" /></span>
			</li>
		</g:each>
		</ol>
	</div>
	
</div>