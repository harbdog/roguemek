<%@ page 
	import="roguemek.MekUser"
	import="roguemek.game.BattleUnit"  
%>

<div class="player">
	<div class="player-name">${user}</div>
	
	<g:each in="${gameInstance?.getUnitsForUser(user)}" var="unit">
		<div class="player-unit">
			<div id="unit-image">
		 		<g:if test="${unit?.image}">
					<%-- show stored byte array as an image on the page --%>
					<img class="unit-image" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': unit.id])}"/>
				</g:if>
			</div>
			
			<g:set var="pilot" value="${unit.pilot}" />
			<span class="unit-name">${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}</span>
		</div>
	</g:each>
</div>