
<%@ page import="roguemek.Weapon" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'weapon.label', default: 'Weapon')}" />
		<title><g:message code="default.list.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#list-weapon" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
			</ul>
		</div>
		<div id="list-weapon" class="content scaffold-list" role="main">
			<h1><g:message code="default.list.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			<table>
			<thead>
					<tr>
					
						<g:sortableColumn property="name" title="${message(code: 'weapon.name.label', default: 'Name')}" />
					
						<g:sortableColumn property="damage" title="${message(code: 'weapon.damage.label', default: 'Damage')}" />
					
						<g:sortableColumn property="heat" title="${message(code: 'weapon.heat.label', default: 'Heat')}" />
					
						<g:sortableColumn property="mass" title="${message(code: 'weapon.mass.label', default: 'Tonnage')}" />
					
						<g:sortableColumn property="crits" title="${message(code: 'weapon.crits.label', default: 'Crits')}" />
					
						<g:sortableColumn property="description" title="${message(code: 'weapon.description.label', default: 'Description')}" />
					
					</tr>
				</thead>
				<tbody>
				<g:each in="${weaponInstanceList}" status="i" var="weaponInstance">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
					
						<td><g:link action="show" id="${weaponInstance.id}">${fieldValue(bean: weaponInstance, field: "name")}</g:link></td>
					
						<td>${fieldValue(bean: weaponInstance, field: "damage")}</td>
					
						<td>${fieldValue(bean: weaponInstance, field: "heat")}</td>
					
						<td>${fieldValue(bean: weaponInstance, field: "mass")}</td>
					
						<td>${fieldValue(bean: weaponInstance, field: "crits")}</td>
					
						<td>${fieldValue(bean: weaponInstance, field: "description")}</td>
					
					</tr>
				</g:each>
				</tbody>
			</table>
			<div class="pagination">
				<g:paginate total="${weaponInstanceCount ?: 0}" />
			</div>
		</div>
	</body>
</html>
