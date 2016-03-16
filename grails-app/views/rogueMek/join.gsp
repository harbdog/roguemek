<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="main">
	</head>
	<body>
		<div id="list-game" class="content scaffold-list" role="main">
			<g:set var="battleName" value="${message(code: 'battle.label', default: 'Battle')}" />
			<h1><g:message code="default.list.label" args="[battleName]" /></h1>
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			<table>
			<thead>
					<tr>
					
						<g:sortableColumn property="description" title="${message(code: 'game.description.label', default: 'Description')}" />
						
						<g:sortableColumn property="ownerUser" title="${message(code: 'game.owner.label', default: 'Owner')}" />
						
						<g:sortableColumn property="board" title="${message(code: 'game.board.label', default: 'Map')}" />
						
						<g:sortableColumn property="CHAT_USERS" title="${message(code: 'game.inchat.label', default: 'In Chat')}" />
						
						<g:sortableColumn property="STAGING_USERS" title="${message(code: 'game.combatants.label', default: 'Combatants')}" />
					
						<g:sortableColumn property="startDate" title="${message(code: 'game.createDate.label', default: 'Created')}" />
					
					</tr>
				</thead>
				<tbody>
					<g:if test="${gameInstanceList}">
						<g:each in="${gameInstanceList}" status="i" var="gameInstance">
							<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
							
								<td><link:stagingGame id="${gameInstance.id}">${gameInstance.description}</link:stagingGame></td>
								
								<td>${fieldValue(bean: gameInstance, field: "ownerUser")}</td>
								
								<g:if test="${gameInstance?.board?.map}">
									<td>${fieldValue(bean: gameInstance, field: "board")}</td>
								</g:if>
								<g:else>
									<td><g:message code="default.button.random.label" /></td>
								</g:else>
								
								<g:if test="${gameChatUserCount[gameInstance]}">
									<td>${gameChatUserCount[gameInstance]}</td>
								</g:if>
								<g:else>
									<td>0</td>
								</g:else>
								
								<g:if test="${stagingUserCount[gameInstance]}">
									<td>${stagingUserCount[gameInstance]}</td>
								</g:if>
								<g:else>
									<td>0</td>
								</g:else>
							
								<td><g:formatDate date="${gameInstance.startDate}" /></td>
							
							</tr>
						</g:each>
					</g:if>
					<g:else>
						<tr class="even">
							<td><g:message code="game.none.found.label" /></td>
							<td>-</td>
							<td>-</td>
							<td>-</td>
							<td>-</td>
							<td>-</td>
						</tr>
					</g:else>
				</tbody>
			</table>
			<div class="pagination">
				<g:paginate total="${gameInstanceCount ?: 0}" />
			</div>
		</div>
	</body>
</html>
