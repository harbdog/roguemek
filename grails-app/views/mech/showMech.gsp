<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<g:set var="entityName" value="${message(code: 'mech.label', default: 'Mech')}" />
		<title><g:message code="default.show.label" args="[entityName]" /></title>
	</head>
	<body>
		<a href="#show-mech" class="skip" tabindex="-1"><g:message code="default.link.skip.label" default="Skip to content&hellip;"/></a>
		<div class="nav" role="navigation">
			<ul>
				<li><a class="home" href="${createLink(uri: '/')}"><g:message code="default.home.label"/></a></li>
				<li><g:link class="list" action="index"><g:message code="default.list.label" args="[entityName]" /></g:link></li>
				<li><g:link class="create" action="create"><g:message code="default.new.label" args="[entityName]" /></g:link></li>
			</ul>
		</div>
		<div id="show-mech" class="content scaffold-show" role="main">
			<h1><g:message code="default.show.label" args="[entityName]" /></h1>
			<g:if test="${flash.message}">
			<div class="message" role="status">${flash.message}</div>
			</g:if>
			<ol class="property-list mech">
			
				<g:if test="${mechInstance?.name}">
				<li class="fieldcontain">
					<span id="name-label" class="property-label"><g:message code="mech.name.label" default="Name" /></span>
					
						<span class="property-value" aria-labelledby="name-label"><g:fieldValue bean="${mechInstance}" field="name"/></span>
						<% 
							def mechImage = roguemek.game.BattleMech.initMechImage(mechInstance)
						 %>
						<g:if test="${mechImage}">
							<span class="property-value" aria-labelledby="name-label"><asset:image class="unit-image" src="${mechImage}" /></span>
						</g:if>
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.description}">
				<li class="fieldcontain">
					<span id="description-label" class="property-label"><g:message code="mech.description.label" default="Description" /></span>
					
						<span class="property-value" aria-labelledby="description-label"><g:fieldValue bean="${mechInstance}" field="description"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.chassis}">
				<li class="fieldcontain">
					<span id="chassis-label" class="property-label"><g:message code="mech.chassis.label" default="Chassis" /></span>
					
						<span class="property-value" aria-labelledby="chassis-label"><g:fieldValue bean="${mechInstance}" field="chassis"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.variant}">
				<li class="fieldcontain">
					<span id="variant-label" class="property-label"><g:message code="mech.variant.label" default="Variant" /></span>
					
						<span class="property-value" aria-labelledby="variant-label"><g:fieldValue bean="${mechInstance}" field="variant"/></span>
					
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
				
				<%--
				<g:if test="${mechInstance?.armor}">
				<li class="fieldcontain">
					<span id="armor-label" class="property-label"><g:message code="mech.armor.label" default="Armor" /></span>
					
						<span class="property-value" aria-labelledby="armor-label"><g:fieldValue bean="${mechInstance}" field="armor"/></span>
						
				</li>
				</g:if>
			
				<g:if test="${mechInstance?.internals}">
				<li class="fieldcontain">
					<span id="internals-label" class="property-label"><g:message code="mech.internals.label" default="Internals" /></span>
					
						<span class="property-value" aria-labelledby="internals-label"><g:fieldValue bean="${mechInstance}" field="internals"/></span>
					
				</li>
				</g:if> 
				--%>
				
				<g:if test="${mechInstance?.crits}">
				<li class="fieldcontain">
					<span id="crits-label" class="property-label"><g:message code="mech.crits.label" default="Critical Slots" /></span>
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Head: ${mechInstance?.armor?.getAt(mechInstance.HEAD)}(${mechInstance?.internals?.getAt(mechInstance.HEAD)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.HEAD)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Left Arm: ${mechInstance?.armor?.getAt(mechInstance.LEFT_ARM)}(${mechInstance?.internals?.getAt(mechInstance.LEFT_ARM)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.LEFT_ARM)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Right Arm: ${mechInstance?.armor?.getAt(mechInstance.RIGHT_ARM)}(${mechInstance?.internals?.getAt(mechInstance.RIGHT_ARM)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.RIGHT_ARM)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Left Torso: ${mechInstance?.armor?.getAt(mechInstance.LEFT_TORSO)}/${mechInstance?.armor?.getAt(mechInstance.LEFT_REAR)}(${mechInstance?.internals?.getAt(mechInstance.LEFT_TORSO)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.LEFT_TORSO)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Right Torso: ${mechInstance?.armor?.getAt(mechInstance.RIGHT_TORSO)}/${mechInstance?.armor?.getAt(mechInstance.RIGHT_REAR)}(${mechInstance?.internals?.getAt(mechInstance.RIGHT_TORSO)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.RIGHT_TORSO)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Center Torso: ${mechInstance?.armor?.getAt(mechInstance.CENTER_TORSO)}/${mechInstance?.armor?.getAt(mechInstance.CENTER_REAR)}(${mechInstance?.internals?.getAt(mechInstance.CENTER_TORSO)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.CENTER_TORSO)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Left Leg: ${mechInstance?.armor?.getAt(mechInstance.LEFT_LEG)}(${mechInstance?.internals?.getAt(mechInstance.LEFT_LEG)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.LEFT_LEG)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
						
						<span class="property-value" aria-labelledby="crits-label">
							<h1>Right Leg: ${mechInstance?.armor?.getAt(mechInstance.RIGHT_LEG)}(${mechInstance?.internals?.getAt(mechInstance.RIGHT_LEG)})</h1>
						</span>
						<g:each in="${mechInstance?.getCritSection(mechInstance.RIGHT_LEG)}" status="i" var="critEquip">
							<span class="property-value" aria-labelledby="crits-label">${critEquip.name}</span>
						</g:each>
						<br/>
				</li>
				</g:if>
			
			</ol>
			
			<g:form url="[resource:mechInstance, action:'delete']" method="DELETE">
				<fieldset class="buttons">
					<g:link class="edit" action="edit" resource="${mechInstance}"><g:message code="default.button.edit.label" default="Edit" /></g:link>
					<g:actionSubmit class="delete" action="delete" value="${message(code: 'default.button.delete.label', default: 'Delete')}" onclick="return confirm('${message(code: 'default.button.delete.confirm.message', default: 'Are you sure?')}');" />
				</fieldset>
			</g:form>
		</div>
	</body>
</html>
