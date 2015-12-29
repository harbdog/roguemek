<%@ page 
	import="roguemek.MekUser"
	import="roguemek.game.BattleUnit"  
%>

<div class="player">
	<div class="player-name">${user}</div>
	<g:each in="${gameInstance?.getUnitsForUser(user)}" var="unit">
		<div class="player-unit">
			<g:if test="${userInstance?.id == user?.id}"><button class="unit-delete" id="${unit?.id}"></button></g:if>
			
			<div id="unit-image">
		 		<g:if test="${unit?.image}">
					<%-- show stored byte array as an image on the page --%>
					<img class="unit-image" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': unit?.id])}"/>
				</g:if>
			</div>
			
			<g:set var="pilot" value="${unit?.pilot}" />
			<span class="unit-name">${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}</span>
		</div>
	</g:each>
	
	<g:if test="${userInstance?.id == user?.id}">
		<g:set var="entityName" value="${message(code: 'game.unit.label', default: 'Unit')}" />
		<button class="unit-add" id="${user?.id}"><g:message code="default.add.label" args="[entityName]" /></button>
	</g:if>
</div>