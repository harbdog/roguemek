<%@ page 
	import="org.apache.catalina.util.URLEncoder"
	import="roguemek.MekUser"
	import="roguemek.game.BattleUnit"
	import="roguemek.game.Game"
	import="roguemek.game.StagingHelper"
%>

<div class="player" data-userid="${user?.id}" data-username="${user?.callsign}">
	<div class="player-info" data-userid="${user?.id}">
		<g:set var="userCamo" value="${StagingHelper.getCamoForUser(gameInstance, user)}" />
	
		<g:if test="${userCamo != null && userCamo instanceof Short[]}">
			<g:set var="camoBackground" value="rgb(${userCamo[0]}, ${userCamo[1]}, ${userCamo[2]})" />
		</g:if>
		<g:elseif test="${userCamo != null && userCamo instanceof String}">
			<%
				def urlEncoder = new URLEncoder()
				urlEncoder.addSafeCharacter((char)'/')
				def userCamoURL = urlEncoder.encode(userCamo)
			%>
			<g:set var="camoBackground" value="url(../assets/camo/${userCamoURL})" />
		</g:elseif>
		<g:else>
			<g:set var="camoBackground" value="rgb(255, 0, 0)" />
		</g:else>
		
		<g:set var="startingLocation" value="${StagingHelper.getStartingLocationForUser(gameInstance, user)}" />
		
		<g:if test="${gameInstance?.isInit()}">
			<g:set var="checkedReady" value="${StagingHelper.getStagingForUser(gameInstance, user)?.isReady ? 'checked' : ''}" />
			<g:set var="disableReady" value="${(userInstance?.id == user?.id) ? '' : 'disabled'}" />
			<g:set var="readyTitle" value="${(userInstance?.id == user?.id) ? message(code: 'staging.game.user.ready.title') : ''}" />
			
			<input type="checkbox" class="player-ready" id="ready-${user?.id}" ${disableReady} ${checkedReady} />
			<label title="${readyTitle}" class="player-ready" for="ready-${user?.id}"></label>
		</g:if>
		
		<span class="player-name">${user}</span>
		
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
		</g:if>
		<g:else>
			<span class="location ui-widget ui-state-default ui-corner-all">
				<span class="location-label">${startingLocation}</span>
				<span class="ui-icon ui-icon-blank"></span>
			</span>
		</g:else>
		
		<g:if test="${gameInstance?.isInit() 
				&& (gameInstance?.ownerUser?.id == userInstance?.id)}">
			<%-- only allowing the game owner to remove individual users --%>
			<button class="user-delete right" data-userid="${user?.id}"></button>
		</g:if>
	</div>
	
	<g:each in="${StagingHelper.getUnitsForUser(gameInstance, user)}" var="unit">
		<g:render template="stageUnit" model="[unit: unit, showUnitDelete: (userInstance?.id == user?.id)]" />
	</g:each>
	
	<div class="player-footer" data-userid="${user?.id}">
		<g:if test="${userInstance?.id == user?.id}">
			<g:set var="entityName" value="${message(code: 'game.unit.label', default: 'Unit')}" />
			<button class="unit-add" data-userid="${user?.id}"><g:message code="default.add.label" args="[entityName]" /></button>
		</g:if>
		
		<g:if test="${gameInstance?.isInit() && userInstance?.id == user?.id}">
			<button class="player-camo" data-userid="${user?.id}" style="background: ${camoBackground}; background-size: 1.5em;"></button>
		</g:if>
	</div>
</div>
