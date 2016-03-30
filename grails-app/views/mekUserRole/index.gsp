
<%@ page import="roguemek.MekUserRole" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'userRole.label', default: 'UserRole')}" />
		<title><g:message code="default.list.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#list-userRole" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="list-userRole" class="content scaffold-list" role="main">
			<h1><g:message code="default.list.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			<table>
			<thead>
					<tr>
					
						<th><g:message code="userRole.role.label" default="Role" /></th>
					
						<th><g:message code="userRole.user.label" default="User" /></th>
						
						<th><g:message code="userRole.delete.label" default="Delete" />?</th>
					
					</tr>
				</thead>
				<tbody>
				<g:each in="${mekUserRoleInstanceList}" status="i" var="mekUserRoleInstance">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
					
						<td>${mekUserRoleInstance?.role?.authority}</td>
					
						<td><g:link controller="mekUser" action="show" id="${mekUserRoleInstance?.user?.id}">${mekUserRoleInstance?.user?.username}</g:link></td>
						
						<g:if test="${userInstance != null && userInstance.id != mekUserRoleInstance?.user?.id}">
							<td><g:link action="delete" params="[authority: mekUserRoleInstance?.role?.authority, userid: mekUserRoleInstance?.user?.id]"><g:message code="userRole.delete.label" default="Delete" /></g:link></td>
						</g:if>
						<g:else>
							<td></td>
						</g:else>
					</tr>
				</g:each>
				</tbody>
			</table>
			<div class="pagination">
				<g:paginate total="${userRoleInstanceCount ?: 0}" />
			</div>
		</div>
	</body>
</html>
