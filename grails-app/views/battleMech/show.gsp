
<%@ page import="roguemek.game.BattleMech" %>
<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'battleMech.label', default: 'BattleMech')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-battleMech" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="index"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-battleMech" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list battleMech">
			
				<% 
					def mechInstance = battleMechInstance?.mech
					def pilotInstance = battleMechInstance?.pilot
				 %>
			
				<g:if test="${mechInstance}">
				<li class="fieldcontain">
					<span id="mech-label" class="property-label"><g:message code="battleMech.mech.label" default="Mech" /></span>
					
						<span class="property-value" aria-labelledby="mech-label"><g:link mapping="mechDetails" params='[chassis:"${mechInstance?.chassis}", variant:"${mechInstance?.variant}"]'>${mechInstance?.name +" "+ mechInstance?.chassis+"-"+mechInstance?.variant}</g:link></span>
					
						<g:if test="${battleMechInstance?.image}">
							<span class="property-value" aria-labelledby="mech-label"><asset:image src="${battleMechInstance?.image}"/></span>
						</g:if>
					
				</li>
				</g:if>
			
				<g:if test="${pilotInstance}">
				<li class="fieldcontain">
					<span id="pilot-label" class="property-label"><g:message code="battleMech.pilot.label" default="Pilot" /></span>
					
						<span class="property-value" aria-labelledby="pilot-label"><g:link controller="pilot" action="show" id="${pilotInstance?.id}">${pilotInstance?.firstName +" \""+pilotInstance?.ownerUser?.callsign+"\" "+pilotInstance?.lastName}</g:link></span>
					
				</li>
				</g:if>
				
				<g:if test="${battleMechInstance?.status}">
				<li class="fieldcontain">
					<span id="status-label" class="property-label"><g:message code="mech.status.label" default="Status" /></span>
					
						<span class="property-value" aria-labelledby="status-label"><g:fieldValue bean="${battleMechInstance}" field="status"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${mechInstance?.tech}">
				<li class="fieldcontain">
					<span id="tech-label" class="property-label"><g:message code="mech.tech.label" default="Tech" /></span>
					
						<span class="property-value" aria-labelledby="tech-label"><g:fieldValue bean="${mechInstance}" field="tech"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${mechInstance?.faction}">
				<li class="fieldcontain">
					<span id="faction-label" class="property-label"><g:message code="mech.faction.label" default="Faction" /></span>
					
						<span class="property-value" aria-labelledby="faction-label"><g:fieldValue bean="${mechInstance}" field="faction"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${mechInstance?.year}">
				<li class="fieldcontain">
					<span id="year-label" class="property-label"><g:message code="mech.year.label" default="Year" /></span>
					
						<span class="property-value" aria-labelledby="year-label"><g:formatNumber number="${mechInstance.year}" format="0000"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.mass}">
				<li class="fieldcontain">
					<span id="mass-label" class="property-label"><g:message code="mech.mass.label" default="Tonnage" /></span>
					
						<span class="property-value" aria-labelledby="mass-label"><g:fieldValue bean="${mechInstance}" field="mass"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${mechInstance?.walkMP}">
				<li class="fieldcontain">
					<span id="walkMP-label" class="property-label"><g:message code="mech.walkMP.label" default="Walk MP" /></span>
					
						<span class="property-value" aria-labelledby="walkmp-label"><g:fieldValue bean="${mechInstance}" field="walkMP"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${mechInstance?.jumpMP}">
				<li class="fieldcontain">
					<span id="jumpMP-label" class="property-label"><g:message code="mech.jumpMP.label" default="Jump MP" /></span>
					
						<span class="property-value" aria-labelledby="jumpMP-label"><g:fieldValue bean="${mechInstance}" field="jumpMP"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${mechInstance?.cbills >= 0}">
				<li class="fieldcontain">
					<span id="cbills-label" class="property-label"><g:message code="mech.cbills.label" default="CBills" /></span>
					
						<span class="property-value" aria-labelledby="cbills-label"><g:fieldValue bean="${mechInstance}" field="cbills"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${mechInstance?.battleValue >= 0}">
				<li class="fieldcontain">
					<span id="battleValue-label" class="property-label"><g:message code="mech.battleValue.label" default="Battle Value" /></span>
					
						<span class="property-value" aria-labelledby="battleValue-label"><g:fieldValue bean="${mechInstance}" field="battleValue"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${battleMechInstance?.crits}">
				<li class="fieldcontain">
					<span id="crits-label" class="property-label"><g:message code="mech.crits.label" default="Critical Slots" /></span>
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Head: ${battleMechInstance?.armor?.getAt(battleMechInstance.HEAD)}(${battleMechInstance?.internals?.getAt(battleMechInstance.HEAD)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.HEAD)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Left Arm: ${battleMechInstance?.armor?.getAt(battleMechInstance.LEFT_ARM)}(${battleMechInstance?.internals?.getAt(battleMechInstance.LEFT_ARM)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.LEFT_ARM)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Right Arm: ${battleMechInstance?.armor?.getAt(battleMechInstance.RIGHT_ARM)}(${battleMechInstance?.internals?.getAt(battleMechInstance.RIGHT_ARM)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.RIGHT_ARM)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Left Torso: ${battleMechInstance?.armor?.getAt(battleMechInstance.LEFT_TORSO)}/${battleMechInstance?.armor?.getAt(battleMechInstance.LEFT_REAR)}(${battleMechInstance?.internals?.getAt(battleMechInstance.LEFT_TORSO)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.LEFT_TORSO)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Right Torso: ${battleMechInstance?.armor?.getAt(battleMechInstance.RIGHT_TORSO)}/${battleMechInstance?.armor?.getAt(battleMechInstance.RIGHT_REAR)}(${battleMechInstance?.internals?.getAt(battleMechInstance.RIGHT_TORSO)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.RIGHT_TORSO)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Center Torso: ${battleMechInstance?.armor?.getAt(battleMechInstance.CENTER_TORSO)}/${battleMechInstance?.armor?.getAt(battleMechInstance.CENTER_REAR)}(${battleMechInstance?.internals?.getAt(battleMechInstance.CENTER_TORSO)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.CENTER_TORSO)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Left Leg: ${battleMechInstance?.armor?.getAt(battleMechInstance.LEFT_LEG)}(${battleMechInstance?.internals?.getAt(battleMechInstance.LEFT_LEG)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.LEFT_LEG)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Right Leg: ${battleMechInstance?.armor?.getAt(battleMechInstance.RIGHT_LEG)}(${battleMechInstance?.internals?.getAt(battleMechInstance.RIGHT_LEG)})</h1>
						</span>
						<g:each in="${battleMechInstance?.getCritSection(battleMechInstance.RIGHT_LEG)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
						</g:each>
						<br/>
				</li>
				</g:if>
			
			</ol>
			<g:form url="[resource:battleMechInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:link class="edit" action="edit" resource="${battleMechInstance}"><g:message code="default.button.edit.label" default="Edit" /></g:link>
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
