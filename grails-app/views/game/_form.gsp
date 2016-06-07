<%@ page import="roguemek.MekUser"
         import="roguemek.game.Game"
         import="roguemek.game.GameChatUser"
         import="roguemek.model.HexMap"
%>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'description', 'error')} required">
    <label for="description">
        <g:message code="game.description.label" default="Description" />
        <span class="required-indicator">*</span>
    </label>
    <g:textField name="description" required="" value="${gameInstance?.description}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'gameState', 'error')} required">
	<label for="gameState">
		<g:message code="game.gameState.label" default="Game State" />
		<span class="required-indicator">*</span>
	</label>
	
	<g:radio name="gameState" value="${Game.GAME_INIT}" checked="${gameInstance?.gameState == Game.GAME_INIT}"/>Init
	<g:radio name="gameState" value="${Game.GAME_ACTIVE}" checked="${gameInstance?.gameState == Game.GAME_ACTIVE}"/>Active
	<g:radio name="gameState" value="${Game.GAME_PAUSED}" checked="${gameInstance?.gameState == Game.GAME_PAUSED}"/>Paused
	<g:radio name="gameState" value="${Game.GAME_OVER}" checked="${gameInstance?.gameState == Game.GAME_OVER}"/>Game Over

</div>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'ownerUser', 'error')} ">
	<label for="ownerUser">
		<g:message code="game.ownerUser.label" default="Owner User" />
	</label>
	<g:select name="ownerUser" from="${MekUser.list(sort: "callsign", order: "asc")}" optionKey="id" value="${gameInstance?.ownerUser?.id}"/>

</div>

<g:if test="${gameInstance?.isInit() || gameInstance?.isActive()}">
    <%
        def chatUsers = []
        def chatUserObjects = GameChatUser.findAllByGame(gameInstance)
        for(GameChatUser gameChatObject in chatUserObjects) {
            chatUsers << gameChatObject?.chatUser
        }
    %>
    <div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'chatUsers', 'error')} ">
    	<label for="chatUsers">
    		<g:message code="game.chat.users.label" default="Chat Users" />
    	</label>
    	<g:select name="chatUsers" from="${chatUsers}" multiple="multiple" optionKey="id" size="${chatUsers.size() ?: 1}" value="${chatUsers*.id}" class="many-to-many"/>

    </div>
</g:if>

<g:if test="${gameInstance?.isInit()}">
    <%-- No need for admin to be able to remove staging users/units, this can be done from staging view --%>
</g:if>
<g:else>
    <g:if test="${gameInstance?.spectators}">
        <div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'spectators', 'error')} ">
        	<label for="spectators">
        		<g:message code="game.spectators.label" default="Spectators" />
        	</label>
        	<g:select name="spectators" from="${gameInstance?.spectators}" multiple="multiple" optionKey="id" size="${gameInstance?.spectators?.size() ?: 1}" value="${gameInstance?.spectators*.id}" class="many-to-many"/>

        </div>
    </g:if>

    <div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'users', 'error')} ">
    	<label for="users">
    		<g:message code="game.users.label" default="Users" />
    	</label>
    	<g:select name="users" from="${gameInstance?.users}" multiple="multiple" optionKey="id" size="${gameInstance?.users?.size() ?: 1}" value="${gameInstance?.users*.id}" class="many-to-many"/>

    </div>
    
    <div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'units', 'error')} ">
    	<label for="units">
    		<g:message code="game.units.label" default="Units" />
    		
    	</label>
    	<g:select name="units" from="${gameInstance?.units}" multiple="multiple" optionKey="id" size="${gameInstance?.units?.size() ?: 1}" value="${gameInstance?.units*.id}" class="many-to-many"/>

    </div>
</g:else>

<sec:ifAnyGranted roles="ROLE_ROOT">
	<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'board.map', 'error')} ">
		<label for="board.map">
			<g:message code="game.map.label" default="Map" />
		</label>
		<g:select name="board.map" from="${HexMap.list(sort: "name", order: "asc")}" optionKey="id" value="${gameInstance?.board?.map?.id}"/>
	
	</div>
</sec:ifAnyGranted>
