<%@ page 
	import="roguemek.game.BattleMech"
	import="roguemek.model.Mech"
 %>
 
 <% 
	def mechInstance = battleMechInstance?.mech
	def pilotInstance = battleMechInstance?.pilot
 %>
 
 <g:set var="entityName" value="${message(code: 'battleMech.label', default: 'BattleMech')}" />
 
 <div id="show-battleMech" class="content scaffold-show" role="main">
 	<div class="header">
 		<h1>
	 		<g:if test="${battleMechInstance?.image}">
				<!-- show stored byte array as an image on the page -->
				<img align="middle" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': battleMechInstance.id])}"/>
			</g:if>
			
			${mechInstance?.name +" "+ mechInstance?.chassis+"-"+mechInstance?.variant}
		</h1>
	</div>
	
	<g:if test="${flash.message}">
	<div class="message" role="status">${flash.message}</div>
	</g:if>
	<ol class="property-list battleMech">
	
		<g:if test="${pilotInstance}">
		<li class="fieldcontain">
			<span id="pilot-label" class="property-label"><g:message code="battleMech.pilot.label" default="Pilot" /></span>
			
				<span class="property-value" aria-labelledby="pilot-label">${pilotInstance?.firstName +" \""+pilotInstance?.ownerUser?.callsign+"\" "+pilotInstance?.lastName}</span>
			
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
					<h1>Head: ${battleMechInstance?.armor?.getAt(Mech.HEAD)}(${battleMechInstance?.internals?.getAt(Mech.HEAD)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.HEAD)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
				
				<span class="property-value" aria-labelledby="crits-label">
					<h1>Left Arm: ${battleMechInstance?.armor?.getAt(Mech.LEFT_ARM)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_ARM)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.LEFT_ARM)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
				
				<span class="property-value" aria-labelledby="crits-label">
					<h1>Right Arm: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_ARM)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_ARM)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.RIGHT_ARM)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
				
				<span class="property-value" aria-labelledby="crits-label">
					<h1>Left Torso: ${battleMechInstance?.armor?.getAt(Mech.LEFT_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.LEFT_REAR)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_TORSO)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.LEFT_TORSO)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
				
				<span class="property-value" aria-labelledby="crits-label">
					<h1>Right Torso: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.RIGHT_REAR)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_TORSO)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.RIGHT_TORSO)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
				
				<span class="property-value" aria-labelledby="crits-label">
					<h1>Center Torso: ${battleMechInstance?.armor?.getAt(Mech.CENTER_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.CENTER_REAR)}(${battleMechInstance?.internals?.getAt(Mech.CENTER_TORSO)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.CENTER_TORSO)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
				
				<span class="property-value" aria-labelledby="crits-label">
					<h1>Left Leg: ${battleMechInstance?.armor?.getAt(Mech.LEFT_LEG)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_LEG)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.LEFT_LEG)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
				
				<span class="property-value" aria-labelledby="crits-label">
					<h1>Right Leg: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_LEG)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_LEG)})</h1>
				</span>
				<g:each in="${battleMechInstance?.getCritSection(Mech.RIGHT_LEG)}" status="i" var="critEquip">
					<g:if test="${critEquip.isActive()}">
						<span class="property-value" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:if>
					<g:else>
						<span class="property-value destroyed" aria-labelledby="crits-label">${critEquip.toString()}</span>
					</g:else>
				</g:each>
				<br/>
		</li>
		</g:if>
	
	</ol>
</div>