
<%@ page import="roguemek.game.Game"
		 import="roguemek.game.GameChatUser"
		 import="roguemek.game.StagingUser"
%>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'game.label', default: 'Game')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-game" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="list"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list game">
			
				<g:if test="${gameInstance?.description}">
				<li class="fieldcontain">
					<span id="description-label" class="property-label"><g:message code="game.description.label" default="Description" /></span>
					
						<span class="property-value" aria-labelledby="description-label"><g:fieldValue bean="${gameInstance}" field="description"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${gameInstance?.gameState}">
				<li class="fieldcontain">
					<span id="gameState-label" class="property-label"><g:message code="game.gameState.label" default="Game State" /></span>
					
						<span class="property-value" aria-labelledby="gameState-label"><g:fieldValue bean="${gameInstance}" field="gameState"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${gameInstance?.ownerUser}">
				<li class="fieldcontain">
					<span id="ownerUser-label" class="property-label"><g:message code="game.ownerUser.label" default="Owner User" /></span>
					
						<span class="property-value" aria-labelledby="ownerUser-label"><g:link controller="mekUser" action="show" id="${gameInstance?.ownerUser.id}">${gameInstance?.ownerUser?.encodeAsHTML()}</g:link></span>
					
				</li>
				</g:if>
				
				<g:if test="${gameInstance?.spectators}">
				<li class="fieldcontain">
					<span id="spectators-label" class="property-label"><g:message code="game.spectators.label" default="Spectators" /></span>
					
						<g:each in="${gameInstance.spectators}" var="u">
						<span class="property-value" aria-labelledby="spectators-label"><g:link controller="mekUser" action="show" id="${u.id}">${u?.encodeAsHTML()}</g:link></span>
						</g:each>
					
				</li>
				</g:if>
			
				<g:if test="${gameInstance?.users}">
				<li class="fieldcontain">
					<span id="users-label" class="property-label"><g:message code="game.users.label" default="Users" /></span>
					
						<g:each in="${gameInstance.users}" var="u">
						<span class="property-value" aria-labelledby="users-label"><g:link controller="mekUser" action="show" id="${u.id}">${u?.encodeAsHTML()}</g:link></span>
						</g:each>
					
				</li>
				</g:if>
				
				<g:if test="${gameInstance?.isInit()}">
				<%
					def stagedUsers = []
					def stagedUserObjects = StagingUser.findAllByGame(gameInstance)
					for(StagingUser stagedObject in stagedUserObjects) {
						stagedUsers << stagedObject?.user
					}
				%>
				<li class="fieldcontain">
					<span id="staged-users-label" class="property-label"><g:message code="game.staged.users.label" default="Staged Users" /></span>
					
						<g:each in="${stagedUsers}" var="u">
						<span class="property-value" aria-labelledby="staged-users-label"><g:link controller="mekUser" action="show" id="${u.id}">${u?.encodeAsHTML()}</g:link></span>
						</g:each>
					
				</li>
				</g:if>
				
				<g:if test="${gameInstance?.isInit() || gameInstance?.isActive()}">
				<%
					def chatUsers = []
					def chatUserObjects = GameChatUser.findAllByGame(gameInstance)
					for(GameChatUser gameChatObject in chatUserObjects) {
						chatUsers << gameChatObject?.chatUser
					}
				%>
				<li class="fieldcontain">
					<span id="chat-users-label" class="property-label"><g:message code="game.chat.users.label" default="Chat Users" /></span>
					
						<g:each in="${chatUsers}" var="u">
						<span class="property-value" aria-labelledby="chat-users-label"><g:link controller="mekUser" action="show" id="${u.id}">${u?.encodeAsHTML()}</g:link></span>
						</g:each>
					
				</li>
				</g:if>
				
				<g:if test="${gameInstance?.units}">
					<li class="fieldcontain">
						<span id="units-label" class="property-label"><g:message code="game.units.label" default="Units" /></span>
						
							<g:each in="${gameInstance.units}" var="u">
							<span class="property-value" aria-labelledby="units-label"><g:link controller="battleMech" action="show" id="${u.id}">${u?.encodeAsHTML()}</g:link></span>
							</g:each>
						
					</li>
				</g:if>
				
				<g:if test="${gameInstance?.board}">
				<li class="fieldcontain">
					<span id="board-label" class="property-label"><g:message code="game.board.label" default="Board" /></span>
					
						<span class="property-value" aria-labelledby="board-label"><g:fieldValue bean="${gameInstance}" field="board"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${gameInstance?.startDate}">
				<li class="fieldcontain">
					<span id="startDate-label" class="property-label"><g:message code="game.startDate.label" default="Start Date" /></span>
					
						<span class="property-value" aria-labelledby="startDate-label"><g:formatDate date="${gameInstance?.startDate}" /></span>
					
				</li>
				</g:if>
			
				<g:if test="${gameInstance?.updateDate}">
				<li class="fieldcontain">
					<span id="updateDate-label" class="property-label"><g:message code="game.updateDate.label" default="Update Date" /></span>
					
						<span class="property-value" aria-labelledby="updateDate-label"><g:formatDate date="${gameInstance?.updateDate}" /></span>
					
				</li>
				</g:if>
				
			</ol>
			<g:form url="[resource:gameInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:link class="edit" action="edit" resource="${gameInstance}"><g:message code="default.button.edit.label" default="Edit" /></g:link>
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
