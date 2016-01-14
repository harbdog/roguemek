<%@ page 
	import="roguemek.MekUser"
	import="roguemek.game.BattleUnit"
	import="roguemek.game.Game"
%>

<div class="player">
	<div class="player-info">
		<span class="player-name">${user}</span>
		
		<g:set var="startingLocation" value="${gameInstance?.getStartingLocationForUser(user)}" />
		
		<g:if test="${gameInstance?.isInit() 
				&& (gameInstance?.ownerUser?.id == userInstance?.id || userInstance?.id == user?.id)}">
			<select name="location" class="location" id="${user?.id}">
				<g:each in="${Game.STARTING_LOCATIONS}" var="location">
					<g:if test="${startingLocation == location}">
						<g:set var="selected" value="selected='selected'" />
					</g:if>
					<g:else>
						<g:set var="selected" value="" />
					</g:else>
					
					<g:if test="${Game.STARTING_NW == location}"><g:set var="iconClass" value="ui-icon-carat-1-nw"/></g:if>
					<g:elseif test="${Game.STARTING_N == location}"><g:set var="iconClass" value="ui-icon-carat-1-n"/></g:elseif>
					<g:elseif test="${Game.STARTING_NE == location}"><g:set var="iconClass" value="ui-icon-carat-1-ne"/></g:elseif>
					<g:elseif test="${Game.STARTING_E == location}"><g:set var="iconClass" value="ui-icon-carat-1-e"/></g:elseif>
					<g:elseif test="${Game.STARTING_SE == location}"><g:set var="iconClass" value="ui-icon-carat-1-se"/></g:elseif>
					<g:elseif test="${Game.STARTING_S == location}"><g:set var="iconClass" value="ui-icon-carat-1-s"/></g:elseif>
					<g:elseif test="${Game.STARTING_SW == location}"><g:set var="iconClass" value="ui-icon-carat-1-sw"/></g:elseif>
					<g:elseif test="${Game.STARTING_W == location}"><g:set var="iconClass" value="ui-icon-carat-1-w"/></g:elseif>
					<g:elseif test="${Game.STARTING_CENTER == location}"><g:set var="iconClass" value="ui-icon-radio-off"/></g:elseif>
					<g:elseif test="${Game.STARTING_RANDOM == location}"><g:set var="iconClass" value="ui-icon-help"/></g:elseif>
					
					<option value="${location}" data-class="${iconClass}" ${selected}>${location}</option>
					
				</g:each>
			</select>
		
			<button class="user-delete" id="${user?.id}"></button>
		</g:if>
		<g:else>
			<label class="location">${startingLocation}</label>
		</g:else>
	</div>
	
	<g:each in="${gameInstance?.getUnitsForUser(user)}" var="unit">
		<div class="player-unit">
			<g:if test="${userInstance?.id == user?.id}">
				<button class="unit-delete" id="${unit?.id}"></button>
			</g:if>
			
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