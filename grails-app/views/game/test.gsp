
<%@ page import="roguemek.game.Game" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="game">
		<g:set var="entityName" value="${message(code: 'test.label', default: 'Game Test')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-game" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="list"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				
				
			</ul>
		</div>
		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			
			<ol class="property-list test">
			
			<g:if test="${gameInstance?.pilots}">
				<li class="fieldcontain">
					<span id="pilots-label" class="property-label"><g:message code="game.pilots.label" default="Pilots" /></span>
					
						<g:each in="${gameInstance.pilots}" var="p">
						<span class="property-value" aria-labelledby="pilots-label"><g:link controller="pilot" action="show" id="${p.id}">${p?.encodeAsHTML()}</g:link></span>
						</g:each>
					
				</li>
			</g:if>
			
			<g:form name="testWeaponForm" url="[action:'testWeapon',controller:'game']" id="testWeaponForm">
			
				<g:if test="${gameInstance?.units}">
					<li class="fieldcontain">
						<span id="unit-label" class="property-label"><g:message code="game.unit.label" default="Test Unit" /></span>
						
							<g:each in="${gameInstance.units}" var="u">
							<span class="property-value" aria-labelledby="unit-label"><g:radio name="testUnit" value="${u.id}"/><g:link controller="battleMech" action="show" id="${u.id}">${u?.encodeAsHTML()}</g:link></span>
							</g:each>
						
					</li>
				</g:if>
				
				<li class="fieldcontain">
					<span id="weapon-label" class="property-label"><g:message code="game.weapon.label" default="Test Weapon" /></span>
						<span class="property-value" aria-labelledby="weapon-label">
						<g:select id="weapon" name='weapon.id' value="${weapon?.id}"
								  noSelection="${['null':'Select One...']}"
								  from='${roguemek.model.Weapon.list()}'
								  optionKey="id" optionValue="name"></g:select>
					  	</span>
				</li>
				
				<li class="fieldcontain">
					<span class="property-value" aria-labelledby="fire-label">
						<input type="submit" value="Fire Weapon" class="btn"/>
					</span>
				</li>
				
			</g:form>
			
			</ol>
		</div>
		
		<div id="testWeaponResults"></div>
	</body>
</html>
