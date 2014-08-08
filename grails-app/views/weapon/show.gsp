
<%@ page import="roguemek.Weapon" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'weapon.label', default: 'Weapon')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-weapon" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="index"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-weapon" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list weapon">
			
				<g:if test="${weaponInstance?.name}">
				<li class="fieldcontain">
					<span id="name-label" class="property-label"><g:message code="weapon.name.label" default="Name" /></span>
					
						<span class="property-value" aria-labelledby="name-label"><g:fieldValue bean="${weaponInstance}" field="name"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${weaponInstance?.damage}">
				<li class="fieldcontain">
					<span id="damage-label" class="property-label"><g:message code="weapon.damage.label" default="Damage" /></span>
					
						<span class="property-value" aria-labelledby="damage-label"><g:fieldValue bean="${weaponInstance}" field="damage"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${weaponInstance?.heat}">
				<li class="fieldcontain">
					<span id="heat-label" class="property-label"><g:message code="weapon.heat.label" default="Heat" /></span>
					
						<span class="property-value" aria-labelledby="heat-label"><g:fieldValue bean="${weaponInstance}" field="heat"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${weaponInstance?.mass}">
				<li class="fieldcontain">
					<span id="mass-label" class="property-label"><g:message code="weapon.mass.label" default="Tonnage" /></span>
					
						<span class="property-value" aria-labelledby="mass-label"><g:fieldValue bean="${weaponInstance}" field="mass"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${weaponInstance?.crits}">
				<li class="fieldcontain">
					<span id="crits-label" class="property-label"><g:message code="weapon.crits.label" default="Crits" /></span>
					
						<span class="property-value" aria-labelledby="crits-label"><g:fieldValue bean="${weaponInstance}" field="crits"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${weaponInstance?.description}">
				<li class="fieldcontain">
					<span id="description-label" class="property-label"><g:message code="weapon.description.label" default="Description" /></span>
					
						<span class="property-value" aria-labelledby="description-label"><g:fieldValue bean="${weaponInstance}" field="description"/></span>
					
				</li>
				</g:if>
			
			</ol>
			<g:form url="[resource:weaponInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
