<%@ page 
	import="roguemek.model.Mech"
	import="roguemek.game.BattleMech"
	import="roguemek.game.HeatEffect"
 %>
 
 <% 
	def mechInstance = battleMechInstance?.mech
	def pilotInstance = battleMechInstance?.pilot
	
	def allHeatEffects = HeatEffect.getAllHeatEffects()
	def unitHeatEffects = HeatEffect.getHeatEffectsAt(battleMechInstance?.heat)
	def heatAsPercent = 100 * (battleMechInstance?.heat / HeatEffect.MAX_HEAT_EFFECT)
	if(heatAsPercent > 100) heatAsPercent = 100
 %>
 
 <g:if test="${battleMechInstance?.isDestroyed()}">
 	<g:set var="entityName" value="${message(code: 'battleMech.destroyed.label', default: 'Scrap Heap')}" />
 </g:if>
 <g:else>
 	<g:set var="entityName" value="${message(code: 'battleMech.label', default: 'BattleMech')}" />
 </g:else>
 
 <div id="show-battleMech" class="content scaffold-show" role="main">
 	<div class="unit-header">
 		<div id="unit-image">
	 		<g:if test="${battleMechInstance?.image}">
				<%-- show stored byte array as an image on the page --%>
				<img src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': battleMechInstance.id])}"/>
			</g:if>
		</div>
		<div id="unit-pilot">
	 		<div id="unit-id">
	 			<span id="unit-name">${mechInstance?.name +" "+ mechInstance?.chassis+"-"+mechInstance?.variant}</span>
		 		<span id="unit-type"><g:message code="unit.mass.type.label" args="[mechInstance.mass, entityName]" /></span>
			</div>
			
			<div id="pilot-id">
				<g:if test="${pilotInstance}">
					<span id="pilot">${pilotInstance?.firstName +" "+pilotInstance?.lastName}</span>
					<span id="owner">${pilotInstance?.ownerUser?.callsign}</span>
				</g:if>
			</div>
		</div>
	</div>
	
	<g:if test="${flash.message}">
		<div class="message" role="status">${flash.message}</div>
	</g:if>
	
	<div id="info-tabs">
		<ul>
			<li><a href="#info-stats"><span>Stats</span></a></li>
			<li><a href="#info-crits"><span>Crits</span></a></li>
		</ul>
	
		<div id="info-stats">
			<div id="statuses">
				<div class="status-positive">
					<g:if test="${battleMechInstance?.isDestroyed()}">
						<%-- nothing positive about being destroyed --%>
					</g:if>
					<g:else>
						<g:if test="${!battleMechInstance?.prone}">
							<div><g:message code="unit.status.standing" /></div>
						</g:if>
						
						<g:if test="${!battleMechInstance?.shutdown}">
							<div><g:message code="unit.status.powered" /></div>
						</g:if>
					</g:else>
				</div>
			
				<div class="status-negative">
					<g:if test="${battleMechInstance?.isDestroyed()}">
						<div><g:message code="unit.status.destroyed" /></div>
					</g:if>
					<g:else>
						<g:if test="${battleMechInstance?.prone}">
							<div><g:message code="unit.status.prone" /></div>
						</g:if>
						
						<g:if test="${battleMechInstance?.shutdown}">
							<div><g:message code="unit.status.shutdown" /></div>
						</g:if>
						
						<g:if test="${unitHeatEffects.size() > 0}">
							<g:each in="${unitHeatEffects}" var="effect">
								<div><g:message code="unit.status.${effect.key.toString()}" args="[effect.value]" /></div>
							</g:each>
						</g:if>
						
					</g:else>
				</div>
			</div>
			
			<div id="points">
				<span>AP Per Turn: ${battleMechInstance?.actionPoints}</span>
				<g:if test="${battleMechInstance?.jumpPoints > 0}">
					<span style="float:right;">JP Per Turn: ${battleMechInstance?.jumpPoints}</span>
				</g:if>
			</div>
			
			<div id="heat">
				<g:if test="${battleMechInstance?.heat >= 0}">
					<style>
						div#heat-bar {
					 		width:${heatAsPercent}%;
						}
					</style>
					
					<span>Heat: ${battleMechInstance?.heat}</span>
					
					<div id="heat-bar-background">
						<div id="heat-bar"></div>
						
						<g:each in="${(HeatEffect.MAX_HEAT_EFFECT..HeatEffect.MIN_HEAT_EFFECT)}" var="count">
							<g:if test="${allHeatEffects[count]}">
								<% def thisPercent = 100 * (count/HeatEffect.MAX_HEAT_EFFECT) %>
								<div class="heat-level" id="heat-level-${count}" style="width:${thisPercent}%"></div>
							</g:if>
						</g:each>
					</div>
				</g:if>
			</div>
			
			<div id="armor">
				<g:if test="${battleMechInstance?.armor}">
					<%
						def armorPercents = [:]
						def internalPercents = [:]
					
						for(def section in Mech.ALL_LOCATIONS) {
							int initialArmor = mechInstance.armor[section]
							int currentArmor =  battleMechInstance.armor[section]
							armorPercents[section] = (initialArmor > 0) ? 100 * currentArmor / initialArmor : 0
							
							if(section <= Mech.RIGHT_LEG) {
								/* rear sections do not have internal at same index */
								int initialInternal = mechInstance.internals.getAt(section)
								int currentInternal = battleMechInstance.internals.getAt(section)
								internalPercents[section] = (initialInternal > 0) ? 100 * currentInternal / initialInternal : 0
							}
						}
						
						def armorBarClass
						def internalBarClass
						def rearBarClass
					%>
				
					<div id="armor-section-1">
						<div id="armor-LA" style="top: 50px;">
							<span class="property-value">
								<h1>Left Arm: ${battleMechInstance?.armor?.getAt(Mech.LEFT_ARM)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_ARM)})</h1>
							</span>
							
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.LEFT_ARM]}"/>' style="height:${armorPercents[Mech.LEFT_ARM]}%"></div></div>
							<div class="internals-bar"><div class='<g:colorPercentClass percent="${internalPercents[Mech.LEFT_ARM]}"/>' style="height:${internalPercents[Mech.LEFT_ARM]}%"></div></div>
						</div>
					</div>
						
					<div id="armor-section-2">
						<div id="armor-LT">
							<span class="property-value">
								<h1>Left Torso: ${battleMechInstance?.armor?.getAt(Mech.LEFT_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.LEFT_REAR)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_TORSO)})</h1>
							</span>
							
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.LEFT_TORSO]}"/>' style="height:${armorPercents[Mech.LEFT_TORSO]}%"></div></div>
							<div class="internals-bar"><div class='<g:colorPercentClass percent="${internalPercents[Mech.LEFT_TORSO]}"/>' style="height:${internalPercents[Mech.LEFT_TORSO]}%"></div></div>
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.LEFT_REAR]}"/>' style="height:${armorPercents[Mech.LEFT_REAR]}%"></div></div>
						</div>
						
						<div id="armor-LL" style="top: 200px;">
							<span class="property-value">
								<h1>Left Leg: ${battleMechInstance?.armor?.getAt(Mech.LEFT_LEG)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_LEG)})</h1>
							</span>
							
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.LEFT_LEG]}"/>' style="height:${armorPercents[Mech.LEFT_LEG]}%"></div></div>
							<div class="internals-bar"><div class='<g:colorPercentClass percent="${internalPercents[Mech.LEFT_LEG]}"/>' style="height:${internalPercents[Mech.LEFT_LEG]}%"></div></div>
						</div>
					</div>
					
					<div id="armor-section-3">
						<div id="armor-HD">
							<span class="property-value">
								<h1>Head: ${battleMechInstance?.armor?.getAt(Mech.HEAD)}(${battleMechInstance?.internals?.getAt(Mech.HEAD)})</h1>
							</span>
							
							<div class="armor-bar" style="height: 50px;"><div class='<g:colorPercentClass percent="${armorPercents[Mech.HEAD]}"/>' style="height:${armorPercents[Mech.HEAD]}%"></div></div>
							<div class="internals-bar" style="height: 25px; margin-top: 25px;"><div class='<g:colorPercentClass percent="${internalPercents[Mech.HEAD]}"/>' style="height:${internalPercents[Mech.HEAD]}%"></div></div>
						</div>
						
						<div id="armor-CT"  style="top: 100px;">
							<span class="property-value">
								<h1>Center Torso: ${battleMechInstance?.armor?.getAt(Mech.CENTER_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.CENTER_REAR)}(${battleMechInstance?.internals?.getAt(Mech.CENTER_TORSO)})</h1>
							</span>
							
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.CENTER_TORSO]}"/>' style="height:${armorPercents[Mech.CENTER_TORSO]}%"></div></div>
							<div class="internals-bar"><div class='<g:colorPercentClass percent="${internalPercents[Mech.CENTER_TORSO]}"/>' style="height:${internalPercents[Mech.CENTER_TORSO]}%"></div></div>
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.CENTER_REAR]}"/>' style="height:${armorPercents[Mech.CENTER_REAR]}%"></div></div>
						</div>
					</div>
					
					<div id="armor-section-4">
						<div id="armor-RT">
							<span class="property-value">
								<h1>Right Torso: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.RIGHT_REAR)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_TORSO)})</h1>
							</span>
							
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.RIGHT_TORSO]}"/>' style="height:${armorPercents[Mech.RIGHT_TORSO]}%"></div></div>
							<div class="internals-bar"><div class='<g:colorPercentClass percent="${internalPercents[Mech.RIGHT_TORSO]}"/>' style="height:${internalPercents[Mech.RIGHT_TORSO]}%"></div></div>
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.RIGHT_REAR]}"/>' style="height:${armorPercents[Mech.RIGHT_REAR]}%"></div></div>
						</div>
						
						<div id="armor-RL"  style="top: 200px;">
							<span class="property-value">
								<h1>Right Leg: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_LEG)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_LEG)})</h1>
							</span>
							
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.RIGHT_LEG]}"/>' style="height:${armorPercents[Mech.RIGHT_LEG]}%"></div></div>
							<div class="internals-bar"><div class='<g:colorPercentClass percent="${internalPercents[Mech.RIGHT_LEG]}"/>' style="height:${internalPercents[Mech.RIGHT_LEG]}%"></div></div>
						</div>
					</div>
					
					<div id="armor-section-5">
						<div id="armor-RA" style="top: 50px;">
							<span class="property-value">
								<h1>Right Arm: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_ARM)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_ARM)})</h1>
							</span>
							
							<div class="armor-bar"><div class='<g:colorPercentClass percent="${armorPercents[Mech.RIGHT_ARM]}"/>' style="height:${armorPercents[Mech.RIGHT_ARM]}%"></div></div>
							<div class="internals-bar"><div class='<g:colorPercentClass percent="${internalPercents[Mech.RIGHT_ARM]}"/>' style="height:${internalPercents[Mech.RIGHT_ARM]}%"></div></div>
						</div>
					</div>
				</g:if>
			</div>
		</div>
	
		<div id="info-crits">
			<g:if test="${battleMechInstance?.crits}">
			
				<div class="crits">
				
					<div id="crit-section-1">
						<div id="mech-LA">
							<span class="property-value">
								<h1>Left Arm: ${battleMechInstance?.armor?.getAt(Mech.LEFT_ARM)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_ARM)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.LEFT_ARM)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
					</div>
						
					<div id="crit-section-2">
						<div id="mech-LT">
							<span class="property-value">
								<h1>Left Torso: ${battleMechInstance?.armor?.getAt(Mech.LEFT_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.LEFT_REAR)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_TORSO)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.LEFT_TORSO)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
						
						<div id="mech-LL">
							<span class="property-value">
								<h1>Left Leg: ${battleMechInstance?.armor?.getAt(Mech.LEFT_LEG)}(${battleMechInstance?.internals?.getAt(Mech.LEFT_LEG)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.LEFT_LEG)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
					</div>
					
					<div id="crit-section-3">
						<div id="mech-HD">
							<span class="property-value">
								<h1>Head: ${battleMechInstance?.armor?.getAt(Mech.HEAD)}(${battleMechInstance?.internals?.getAt(Mech.HEAD)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.HEAD)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
						
						<div id="mech-CT">
							<span class="property-value">
								<h1>Center Torso: ${battleMechInstance?.armor?.getAt(Mech.CENTER_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.CENTER_REAR)}(${battleMechInstance?.internals?.getAt(Mech.CENTER_TORSO)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.CENTER_TORSO)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
					</div>
					
					<div id="crit-section-4">
						<div id="mech-RT">
							<span class="property-value">
								<h1>Right Torso: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_TORSO)}/${battleMechInstance?.armor?.getAt(Mech.RIGHT_REAR)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_TORSO)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.RIGHT_TORSO)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
						
						<div id="mech-RL">
							<span class="property-value">
								<h1>Right Leg: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_LEG)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_LEG)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.RIGHT_LEG)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
					</div>
					
					<div id="crit-section-5">
						<div id="mech-RA">
							<span class="property-value">
								<h1>Right Arm: ${battleMechInstance?.armor?.getAt(Mech.RIGHT_ARM)}(${battleMechInstance?.internals?.getAt(Mech.RIGHT_ARM)})</h1>
							</span>
							<g:each in="${battleMechInstance?.getCritSection(Mech.RIGHT_ARM)}" status="i" var="critEquip">
								<g:if test="${critEquip.isActive()}">
									<span class="property-value">${critEquip.toString()}</span>
								</g:if>
								<g:else>
									<span class="property-value destroyed">${critEquip.toString()}</span>
								</g:else>
							</g:each>
						</div>
					</div>
				</div>
			</g:if>
		</div>
		
	</div>
</div>

<script>
	$( "#info-tabs" ).tabs();
</script>