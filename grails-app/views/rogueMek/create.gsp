<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="main">
	</head>
	<body id="body">
		<div id="create-game" class="content scaffold-create" role="main">
			<g:set var="battleName" value="${message(code: 'battle.label', default: 'Battle')}" />
			<h1><g:message code="default.new.label" args="[battleName]" /></h1>
	
		    <g:if test="${flash.message}">
	            <div class="message" role="status">${flash.message}</div>
	        </g:if>
	        <g:hasErrors bean="${gameInstance}">
			<ul class="errors" role="alert">
				<g:eachError bean="${gameInstance}" var="error">
				<li <g:if test="${error in org.springframework.validation.FieldError}">data-field-id="${error.field}"</g:if>><g:message error="${error}"/></li>
				</g:eachError>
			</ul>
			</g:hasErrors>
	        
	        <g:form url="[resource:gameInstance, action:'saveCreate']" >
		        <fieldset class="form">
			        <div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'description', 'error')} required">
					    <label for="description">
					        <g:message code="game.description.label" default="Description" />
					        <span class="required-indicator">*</span>
					    </label>
					    <g:textField name="description" required="" value="${gameInstance?.description}" autocomplete="false" autofocus="true"/>
					</div>
					
					<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'privateGame', 'error')} ">
						<label for="privateGame">
							<g:message code="game.private.label" default="Private Battle" />
						</label>
						<g:checkBox name="privateGame" value="${gameInstance?.privateGame}" />
					</div>
					
					<%-- TODO: Add more options for the new game --%>
					
				</fieldset>
				
				<fieldset class="buttons">
					<g:submitButton name="create" class="save" value="${message(code: 'default.button.create.label', default: 'Create')}" />
				</fieldset>
			</g:form>
		</div>
    </body>
</html>