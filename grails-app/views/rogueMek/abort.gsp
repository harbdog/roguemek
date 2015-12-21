<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'battle.label', default: 'Battle')}" />
		<title><g:message code="default.abort.label" args="[entityName]" /></title>
	</head>
	<body>
		<div id="show-game" class="content scaffold-show" role="main">
			<h1>${gameInstance?.description}</h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			
			<div class="paragraph"><g:message code="warning.abort.game" /></div>
			
			<g:form action="delete" id="${gameInstance.id}" method="DELETE">
				<fieldset class="buttons">
					<link:stagingGame id="${gameInstance.id}">${message(code: 'default.button.cancel.label', default: 'Cancel')}</link:stagingGame>
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.confirm.label', default: 'Confirm')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
