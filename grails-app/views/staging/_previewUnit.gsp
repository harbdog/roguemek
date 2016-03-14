<%@ page
	import="roguemek.model.*" 
 %>

<div id="unit-image-preview">
	<%-- show unit image using tag lib, start out as static then after it loads javascript can swap in the animated class --%>
	<g:unitImage unitId="${unit?.id}" animated="false" />
</div>

<div id="unit-info-preview">
	<div class="unit-info-header">
		<span class="unit-name">${unit?.name}</span>
		<span class="unit-mass right"><g:message code="unit.mass.label" args="[unit?.mass]" /></span>
	</div>
	
	<div class="unit-info-subheader">
		<g:if test="${unit instanceof Mech}" >
			<span class="unit-chassis-variant">${unit.chassis}-${unit.variant}</span>
			<span class="unit-weight-class right">${unit.getWeightClass().capitalize()}</span>
		</g:if>
	</div>
	
	<div class="unit-stats">
		<g:if test="${unit instanceof Mech}" >
			<%	// AP calculated as runMP dividided by 2 (rounded up) plus 1
				int runMP = Math.ceil(unit.walkMP * 1.5)
				int unitAP = Math.floor(runMP / 2) + (runMP % 2) + 1
				
				// JP calculated as jumpMP divided by 2 (rounded up)
				int unitJP = (unit.jumpMP > 0) ? Math.floor(unit.jumpMP / 2) + (unit.jumpMP % 2) : 0
			%>
			
			<span><g:message code="unit.actionpoints.label" />: ${unitAP} AP</span>
			
			<g:if test="${unitJP > 0}">
				<span class="right"><g:message code="unit.jumppoints.label" />: ${unitJP} JP</span>
			</g:if>
		</g:if>
	</div>
	
	<div class="unit-equipment">
		<g:if test="${unit instanceof Mech}" >
			<%
				// find and map out heat sinks, weapons, and other important equipment from criticals
				def heatsinks = [:] // [[<heatsink>:<critCount>], ...]
				def weapons = [:]	// [[<weapon>:<critCount>], ...]
				
				def ammos = [:]		// [[<ammo>:<critCount>], ...]
				def weaponAmmo = [:]// [[<weapon>:<ammoCount>], ...]
				
				for(def critSectionIndex in Mech.CRIT_LOCATIONS) {
					def critEquipment = unit.getCritSection(critSectionIndex)
					
					for(def thisEquip in critEquipment) {
						def map
						if(thisEquip instanceof Weapon) {
							map = weapons
						} else if(thisEquip instanceof HeatSink) {
							map = heatsinks
						}
						else if(thisEquip instanceof Ammo) {
							map = ammos
						}
						
						if(map != null) {
							if(map[thisEquip] == null) {
								map[thisEquip] = 1
							}
							else {
								map[thisEquip] += 1
							}
						}
					}
				}
				
				// adjust equipment for crit slots used per item
				int numHeatSinks = 10
				heatsinks.each { HeatSink heatsink, int critCount ->
					numHeatSinks += (critCount / heatsink.crits)
				}
				
				weapons.each { Weapon weapon, int critCount ->
					weapons[weapon] = (critCount / weapon.crits)
					
					// calculate amount of ammo for weapons
					if(weapon.ammoTypes) {
						weapon.ammoTypes.each { Ammo at ->
							if(weaponAmmo[weapon] == null) {
								weaponAmmo[weapon] = 0
							}
							
							def ammoCount = ammos[at]
							if(ammoCount != null) {
								weaponAmmo[weapon] += (ammoCount * at.ammoPerTon)
							}
						}
					} 
				}
				
				def sortedWeapons = weapons.sort( { k1, k2 -> k1.name <=> k2.name } as Comparator )*.key
			%>
		
			<g:if test="${unit.heatSinkType == Unit.HS_SINGLE}">
				<div class="unit-heatsinks"><span><g:message code="unit.single.heatsinks.label" />: ${numHeatSinks}</span></div>
			</g:if>
			<g:elseif test="${unit.heatSinkType == Unit.HS_DOUBLE}">
				<div class="unit-heatsinks"><span><g:message code="unit.double.heatsinks.label" />: ${numHeatSinks}</span></div>
			</g:elseif>
			
			<div class="unit-weapons">
				<g:each in="${sortedWeapons}" var="thisWeapon">
					<p>
						<span>${weapons[thisWeapon]}x</span>
						<span>${thisWeapon.name}</span>
						<g:if test="${weaponAmmo[thisWeapon]}"><span>[${weaponAmmo[thisWeapon]}]</span></g:if>
					</p>
				</g:each>
			</div>
		</g:if>
	</div>
	
	<div class="unit-total-armor">
		<g:if test="${unit instanceof Mech}" >
			<%
				int totalArmor = 0
				unit.armor?.each {
					totalArmor += it
				}
			%>
			<span><g:message code="unit.armor.label" />: ${totalArmor}</span>
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