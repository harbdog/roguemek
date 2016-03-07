
<div class="fieldcontain ${hasErrors(bean: mechInstance, field: 'name', 'error')} required">
	<label for="name">
		<g:message code="mech.name.label" default="Name" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="name" required="" value="${mechInstance?.name}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: mechInstance, field: 'description', 'error')} required">
	<label for="description">
		<g:message code="mech.description.label" default="Description" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="description" required="" value="${mechInstance?.description}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: mechInstance, field: 'chassis', 'error')} required">
	<label for="chassis">
		<g:message code="mech.chassis.label" default="Chassis" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="chassis" required="" value="${mechInstance?.chassis}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: mechInstance, field: 'variant', 'error')} required">
	<label for="variant">
		<g:message code="mech.variant.label" default="Variant" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="variant" required="" value="${mechInstance?.variant}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: mechInstance, field: 'mass', 'error')} required">
	<label for="mass">
		<g:message code="mech.mass.label" default="Tonnage" />
		<span class="required-indicator">*</span>
	</label>
	<g:select name="mass" from="${(20..100).step(5)}" class="range" required="" value="${fieldValue(bean: mechInstance, field: 'mass')}"/>

</div>
