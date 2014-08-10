
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'mech.label', default: 'Mech')}" />
		<title><g:message code="default.list.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#list-mech" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="list-mech" class="content scaffold-list" role="main">
			<h1><g:message code="default.list.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			<table>
			<thead>
					<tr>
					
						<g:sortableColumn property="name" title="${message(code: 'mech.name.label', default: 'Name')}" />
					
						<g:sortableColumn property="description" title="${message(code: 'mech.description.label', default: 'Description')}" />
					
						<g:sortableColumn property="chassis" title="${message(code: 'mech.chassis.label', default: 'Chassis')}" />
					
						<g:sortableColumn property="variant" title="${message(code: 'mech.variant.label', default: 'Variant')}" />
					
						<g:sortableColumn property="mass" title="${message(code: 'mech.mass.label', default: 'Tonnage')}" />
					
						<g:sortableColumn property="armor" title="${message(code: 'mech.walkMP.label', default: 'Walk MP')}" />
						
						<g:sortableColumn property="armor" title="${message(code: 'mech.jumpMP.label', default: 'Jump MP')}" />
					
					</tr>
				</thead>
				<tbody>
				<g:each in="${mechInstanceList}" status="i" var="mechInstance">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
					
						<td><g:link mapping="mechDetails" params='[chassis:"${mechInstance?.chassis}", variant:"${mechInstance?.variant}"]'>${fieldValue(bean: mechInstance, field: "name")}</g:link></td>
					
						<td>${fieldValue(bean: mechInstance, field: "description")}</td>
					
						<td>${fieldValue(bean: mechInstance, field: "chassis")}</td>
					
						<td>${fieldValue(bean: mechInstance, field: "variant")}</td>
					
						<td>${fieldValue(bean: mechInstance, field: "mass")}</td>
					
						<td>${fieldValue(bean: mechInstance, field: "walkMP")}</td>
						
						<td>${fieldValue(bean: mechInstance, field: "jumpMP")}</td>
					
					</tr>
				</g:each>
				</tbody>
			</table>
			<div class="pagination">
				<g:paginate total="${mechInstanceCount ?: 0}" />
			</div>
		</div>
	</body>
</html>
