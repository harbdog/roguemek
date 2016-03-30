
<%@ page import="roguemek.game.Game" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'game.label', default: 'Game')}" />
		<title><g:message code="default.list.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#list-game" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>

		<div id="list-game" class="content scaffold-list" role="main">
			<h1><g:message code="default.list.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			<table>
			<thead>
					<tr>
					
						<g:sortableColumn property="id" title="${message(code: 'game.description.label', default: 'Description')}" />
						
						<g:sortableColumn property="ownerUser" title="${message(code: 'game.ownerUser.label', default: 'Owner User')}" />
					
						<g:sortableColumn property="gameState" title="${message(code: 'game.gameState.label', default: 'Game State')}" />
						
						<g:sortableColumn property="board" title="${message(code: 'game.board.label', default: 'Map')}" />
					
						<g:sortableColumn property="startDate" title="${message(code: 'game.startDate.label', default: 'Started')}" />
					
						<g:sortableColumn property="updateDate" title="${message(code: 'game.updateDate.label', default: 'Updated')}" />
					
					</tr>
				</thead>
				<tbody>
				<g:each in="${gameInstanceList}" status="i" var="gameInstance">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
					
						<td><g:link action="show" id="${gameInstance.id}">${fieldValue(bean: gameInstance, field: "description")}</g:link></td>
						
						<td><g:link controller="mekUser" action="show" id="${gameInstance.ownerUser.id}">${fieldValue(bean: gameInstance, field: "ownerUser")}</g:link></td>
						
						<td>${fieldValue(bean: gameInstance, field: "gameState")}</td>
						
						<td>${fieldValue(bean: gameInstance, field: "board")}</td>
					
						<td><g:formatDate date="${gameInstance.startDate}" /></td>
					
						<td><g:formatDate date="${gameInstance.updateDate}" /></td>
					
					</tr>
				</g:each>
				</tbody>
			</table>
			<div class="pagination">
				<g:paginate total="${gameInstanceCount ?: 0}" />
			</div>
		</div>
	</body>
</html>
