
<%@ page import="roguemek.MekUser" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'user.label', default: 'User')}" />
		<title><g:message code="default.list.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#list-user" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		
		<sec:ifAnyGranted roles="ROLE_ADMIN">
		<div class="nav" role="navigation">
			<ul>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		</sec:ifAnyGranted>
		
		<div id="list-user" class="content scaffold-list" role="main">
			<h1><g:message code="default.list.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			<table>
			<thead>
					<tr>
					
						<g:sortableColumn property="callsign" title="${message(code: 'user.callsign.label', default: 'Callsign')}" />
					
						<sec:ifAnyGranted roles="ROLE_ADMIN">
							<g:sortableColumn property="username" title="${message(code: 'user.email.label', default: 'Username/Email')}" />
							
							<g:sortableColumn property="signupDate" title="${message(code: 'user.signupDate.label', default: 'Registered')}" />
					
							<g:sortableColumn property="accountLocked" title="${message(code: 'user.accountLocked.label', default: 'Locked')}" />
						
							<g:sortableColumn property="enabled" title="${message(code: 'user.enabled.label', default: 'Enabled')}" />
							
							<g:sortableColumn property="lastLoginDate" title="${message(code: 'user.lastLogin.label', default: 'Last Login')}" />
						</sec:ifAnyGranted>
						
						<sec:ifAnyGranted roles="ROLE_ROOT">
							<g:sortableColumn property="country" title="${message(code: 'user.country.label', default: 'Country')}" />
						</sec:ifAnyGranted>
					</tr>
				</thead>
				<tbody>
				<g:each in="${mekUserInstanceList}" status="i" var="mekUserInstance">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
					
						<td><g:link mapping="userDetails" params='[callsign:"${mekUserInstance?.callsign}"]'>${mekUserInstance?.callsign}</g:link></td>
					
						<sec:ifAnyGranted roles="ROLE_ADMIN">
							<td><g:link action="show" id="${mekUserInstance.id}">${fieldValue(bean: mekUserInstance, field: "username")}</g:link></td>
							
							<td><span class="property-value"><g:formatDate format="yyyy-MM-dd" date="${mekUserInstance.signupDate}"/></span></td>
						
							<td><g:formatBoolean boolean="${mekUserInstance.accountLocked}" /></td>
						
							<td><g:formatBoolean boolean="${mekUserInstance.enabled}" /></td>
							
							<td><span class="property-value"><g:formatDate date="${mekUserInstance.lastLoginDate}"/></span></td>
						</sec:ifAnyGranted>
						
						<sec:ifAnyGranted roles="ROLE_ROOT">
							<td><span class="property-value">${mekUserInstance.country}</span></td>
						</sec:ifAnyGranted>
					</tr>
				</g:each>
				</tbody>
			</table>
			<div class="pagination">
				<g:paginate total="${userInstanceCount ?: 0}" />
			</div>
		</div>
	</body>
</html>
