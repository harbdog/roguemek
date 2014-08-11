
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
				
				<g:if test="${weaponInstance?.aliases}">
				<li class="fieldcontain">
					<span id="aliases-label" class="property-label"><g:message code="weapon.aliases.label" default="Aliases" /></span>
					
						<g:each in="${weaponInstance?.aliases}" status="i" var="alias"><span class="property-value" aria-labelledby="aliases-label">${alias}</span></g:each>
						
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.description}">
				<li class="fieldcontain">
					<span id="description-label" class="property-label"><g:message code="weapon.description.label" default="Description" /></span>
					
						<span class="property-value" aria-labelledby="description-label"><g:fieldValue bean="${weaponInstance}" field="description"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.mass}">
				<li class="fieldcontain">
					<span id="mass-label" class="property-label"><g:message code="weapon.mass.label" default="Mass" /></span>
					
						<span class="property-value" aria-labelledby="mass-label"><g:fieldValue bean="${weaponInstance}" field="mass"/></span>
					
				</li>
				</g:if>
			
				<g:if test="${weaponInstance?.crits}">
				<li class="fieldcontain">
					<span id="crits-label" class="property-label"><g:message code="weapon.crits.label" default="Crits" /></span>
					
						<span class="property-value" aria-labelledby="crits-label"><g:fieldValue bean="${weaponInstance}" field="crits"/></span>
					
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
			
				<g:if test="${weaponInstance?.cycle}">
				<li class="fieldcontain">
					<span id="cycle-label" class="property-label"><g:message code="weapon.cycle.label" default="Cycle" /></span>
					
						<span class="property-value" aria-labelledby="cycle-label"><g:fieldValue bean="${weaponInstance}" field="cycle"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.projectiles}">
				<li class="fieldcontain">
					<span id="projectiles-label" class="property-label"><g:message code="weapon.projectiles.label" default="Projectiles" /></span>
					
						<span class="property-value" aria-labelledby="projectiles-label"><g:fieldValue bean="${weaponInstance}" field="projectiles"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.minRange >= 0}">
				<li class="fieldcontain">
					<span id="minRange-label" class="property-label"><g:message code="weapon.minRange.label" default="Min Range" /></span>
					
						<span class="property-value" aria-labelledby="minRange-label"><g:fieldValue bean="${weaponInstance}" field="minRange"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.shortRange}">
				<li class="fieldcontain">
					<span id="shortRange-label" class="property-label"><g:message code="weapon.shortRange.label" default="Short Range" /></span>
					
						<span class="property-value" aria-labelledby="shortRange-label"><g:fieldValue bean="${weaponInstance}" field="shortRange"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.mediumRange}">
				<li class="fieldcontain">
					<span id="mediumRange-label" class="property-label"><g:message code="weapon.mediumRange.label" default="Medium Range" /></span>
					
						<span class="property-value" aria-labelledby="mediumRange-label"><g:fieldValue bean="${weaponInstance}" field="mediumRange"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.longRange}">
				<li class="fieldcontain">
					<span id="longRange-label" class="property-label"><g:message code="weapon.longRange.label" default="Long Range" /></span>
					
						<span class="property-value" aria-labelledby="longRange-label"><g:fieldValue bean="${weaponInstance}" field="longRange"/></span>
					
				</li>
				</g:if>
				
				<g:if test="${weaponInstance?.ammoTypes}">
				<li class="fieldcontain">
					<span id="ammoTypes-label" class="property-label"><g:message code="weapon.ammoTypes.label" default="Ammo Types" /></span>
					
						<span class="property-value" aria-labelledby="ammoTypes-label">
							<g:each in="${weaponInstance?.ammoTypes}" status="i" var="ammoInstance"><g:fieldValue bean="${ammoInstance}" field="name"/></g:each>
						</span>
					
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
