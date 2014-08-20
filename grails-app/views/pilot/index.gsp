
<%@ page import="roguemek.model.Pilot" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'pilot.label', default: 'Pilot')}" />
		<title><g:message code="default.list.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#list-pilot" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="list-pilot" class="content scaffold-list" role="main">
			<h1><g:message code="default.list.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			<table>
			<thead>
					<tr>
					
						<g:sortableColumn property="firstName" title="${message(code: 'pilot.firstName.label', default: 'First Name')}" />
					
						<g:sortableColumn property="lastName" title="${message(code: 'pilot.lastName.label', default: 'Last Name')}" />
						
						<g:sortableColumn property="status" title="${message(code: 'pilot.status.label', default: 'Status')}" />
					
						<th><g:message code="pilot.ownerUser.label" default="Owner User" /></th>
						
					</tr>
				</thead>
				<tbody>
				<g:each in="${pilotInstanceList}" status="i" var="pilotInstance">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
					
						<td><g:link action="show" id="${pilotInstance.id}">${fieldValue(bean: pilotInstance, field: "firstName")}</g:link></td>
					
						<td>${fieldValue(bean: pilotInstance, field: "lastName")}</td>
						
						<td>${fieldValue(bean: pilotInstance, field: "status")}</td>
					
						<td>${pilotInstance?.ownerUser?.username}</td>
					
					</tr>
				</g:each>
				</tbody>
			</table>
			<div class="pagination">
				<g:paginate total="${pilotInstanceCount ?: 0}" />
			</div>
		</div>
	</body>
</html>
