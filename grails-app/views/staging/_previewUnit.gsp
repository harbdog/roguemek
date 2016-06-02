<%@ page
	import="roguemek.model.*" 
 %>

<div class="unit-preview-top">
	<div id="unit-image-preview">
		<%-- show unit image using tag lib, start out as static then after it loads javascript can swap in the animated class --%>
		<g:unitImage unitId="${unit?.id}" animated="false" />
	</div>
</div>

<div class="unit-preview-middle">
	<div id="unit-info-preview">
		<div class="unit-info-header">
			<g:if test="${unitLink}">
				<a href="${unitLink}" title="${message(code: 'staging.unit.external.link.title')}" target="_blank">
					<span class="unit-name">${unit?.name}<span class="ui-icon ui-icon-extlink" style="display:inline-block;"></span></span>
				</a>
			</g:if>
			<g:else>
				<span class="unit-name">${unit?.name}</span>
			</g:else>
			<span class="unit-mass-right right"><g:message code="unit.mass.label" args="[unit?.mass]" /></span>
		</div>
		
		<div class="unit-info-subheader">
			<g:if test="${unit instanceof Mech}" >
				<span class="unit-chassis-variant">${unit.chassis}-${unit.variant}</span>
				<span class="unit-weight-class right">${unit.getWeightClass().capitalize()}</span>
			</g:if>
		</div>
		
		<div class="unit-stats">
			<g:if test="${unit instanceof Mech}" >
				<span><g:message code="unit.actionpoints.label" />: ${unitSummary.unitAP} AP</span>
				
				<g:if test="${unitSummary.unitJP > 0}">
					<span class="right"><g:message code="unit.jumppoints.label" />: ${unitSummary.unitJP} JP</span>
				</g:if>
			</g:if>
		</div>
		
		<div class="unit-equipment">
			<g:if test="${unit instanceof Mech}" >
				<g:if test="${unit.heatSinkType == Unit.HS_SINGLE}">
					<div class="unit-heatsinks"><span><g:message code="unit.single.heatsinks.label" />: ${unitSummary.numHeatSinks}</span></div>
				</g:if>
				<g:elseif test="${unit.heatSinkType == Unit.HS_DOUBLE}">
					<div class="unit-heatsinks"><span><g:message code="unit.double.heatsinks.label" />: ${unitSummary.numHeatSinks}</span></div>
				</g:elseif>
				
				<div class="unit-weapons">
					<g:each in="${unitSummary.sortedWeapons}" var="thisWeapon">
						<p>
							<span>${unitSummary.weapons[thisWeapon]}x</span>
							<span>${thisWeapon}</span>
							<g:if test="${unitSummary.weaponAmmo[thisWeapon]}"><span>[${unitSummary.weaponAmmo[thisWeapon]}]</span></g:if>
						</p>
					</g:each>
				</div>
			</g:if>
		</div>
		
		<div class="unit-total-armor">
			<g:if test="${unit instanceof Mech}" >
				<span><g:message code="unit.armor.label" />: ${unitSummary.totalArmor} / ${unitSummary.maxArmor}</span>
			</g:if>
		</div>
		
		<div class="unit-armor">
			<g:if test="${unit instanceof Mech}" >
				<div id="armor-section-1">
					<div id="armor-LA" style="top: 2em;">
						<g:set var="critSection" value="${Mech.LEFT_ARM}" />
						<span class="property-value">
							LA<br/>${unit.armor?.getAt(critSection)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
				</div>
				
				<div id="armor-section-2">
					<div id="armor-LT" style="top: 1em;">
						<g:set var="critSection" value="${Mech.LEFT_TORSO}" />
						<span class="property-value">
							LT/R<br/>${unit.armor?.getAt(critSection)}/${unit.armor?.getAt(Mech.LEFT_REAR)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
					
					<div id="armor-LL" style="top: 6em;">
						<g:set var="critSection" value="${Mech.LEFT_LEG}" />
						<span class="property-value">
							LL<br/>${unit.armor?.getAt(critSection)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
				</div>
				
				<div id="armor-section-3">
					<div id="armor-HD">
						<g:set var="critSection" value="${Mech.HEAD}" />
						<span class="property-value">
							HD<br/>${unit.armor?.getAt(critSection)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
					
					<div id="armor-CT"  style="top: 4em;">
						<g:set var="critSection" value="${Mech.CENTER_TORSO}" />
						<span class="property-value">
							CT/R<br/>${unit.armor?.getAt(critSection)}/${unit.armor?.getAt(Mech.CENTER_REAR)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
				</div>
				
				<div id="armor-section-4">
					<div id="armor-RT" style="top: 1em;">
						<g:set var="critSection" value="${Mech.RIGHT_TORSO}" />
						<span class="property-value">
							RT/R<br/>${unit.armor?.getAt(critSection)}/${unit.armor?.getAt(Mech.RIGHT_REAR)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
					
					<div id="armor-RL"  style="top: 6em;">
						<g:set var="critSection" value="${Mech.RIGHT_LEG}" />
						<span class="property-value">
							RL<br/>${unit.armor?.getAt(critSection)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
				</div>
				
				<div id="armor-section-5">
					<div id="armor-RA" style="top: 2em;">
						<g:set var="critSection" value="${Mech.RIGHT_ARM}" />
						<span class="property-value">
							RA<br/>${unit.armor?.getAt(critSection)}(${unit.internals?.getAt(critSection)})
						</span>
					</div>
				</div>
			</g:if>
		</div>
	</div>
</div>
