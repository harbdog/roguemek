<%@ page 
	import="roguemek.MekUser"
	import="roguemek.game.BattleUnit"
	import="roguemek.game.Game"
	import="roguemek.game.StagingHelper"
%>

<div class="player" data-userid="${user?.id}">
	<div class="player-info" data-userid="${user?.id}">
		<g:set var="userCamo" value="${StagingHelper.getCamoForUser(gameInstance, user)}" />
	
		<g:if test="${userCamo != null && userCamo instanceof Short[]}">
			<g:set var="rgbCamoBackground" value="rgb(${userCamo[0]}, ${userCamo[1]}, ${userCamo[2]})" />
		</g:if>
		<g:else>
			<g:set var="rgbCamoBackground" value="rgb(255, 0, 0)" />
		</g:else>
	
		<g:if test="${gameInstance?.isInit() 
				&& (gameInstance?.ownerUser?.id == userInstance?.id || userInstance?.id == user?.id)}">
			<button class="player-camo" data-userid="${user?.id}" style="background: ${rgbCamoBackground};"></button>
		</g:if>
		<g:else>
			<span class="player-camo" style="background: ${rgbCamoBackground};"></span>
		</g:else>
	
		<span class="player-name">${user}</span>
		
		<g:set var="startingLocation" value="${StagingHelper.getStartingLocationForUser(gameInstance, user)}" />
		
		<g:if test="${gameInstance?.isInit() 
				&& (gameInstance?.ownerUser?.id == userInstance?.id || userInstance?.id == user?.id)}">
			<select name="location" class="location" data-userid="${user?.id}">
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
		
			<button class="user-delete" data-userid="${user?.id}"></button>
		</g:if>
		<g:else>
			<label class="location">${startingLocation}</label>
		</g:else>
	</div>
	
	<g:each in="${gameInstance?.getUnitsForUser(user)}" var="unit">
		<g:render template="stageUnit" model="[unit: unit, showUnitDelete: (userInstance?.id == user?.id)]" />
	</g:each>
	
	<g:if test="${userInstance?.id == user?.id}">
		<g:set var="entityName" value="${message(code: 'game.unit.label', default: 'Unit')}" />
		<button class="unit-add" data-userid="${user?.id}"><g:message code="default.add.label" args="[entityName]" /></button>
	</g:if>
</div>