<%@ page import="roguemek.Weapon" %>



<div class="fieldcontain ${hasErrors(bean: weaponInstance, field: 'name', 'error')} required">
	<label for="name">
		<g:message code="weapon.name.label" default="Name" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="name" required="" value="${weaponInstance?.name}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: weaponInstance, field: 'damage', 'error')} required">
	<label for="damage">
		<g:message code="weapon.damage.label" default="Damage" />
		<span class="required-indicator">*</span>
	</label>
	<g:field name="damage" type="number" value="${weaponInstance.damage}" required=""/>

</div>

<div class="fieldcontain ${hasErrors(bean: weaponInstance, field: 'heat', 'error')} required">
	<label for="heat">
		<g:message code="weapon.heat.label" default="Heat" />
		<span class="required-indicator">*</span>
	</label>
	<g:field name="heat" type="number" value="${weaponInstance.heat}" required=""/>

</div>

<div class="fieldcontain ${hasErrors(bean: weaponInstance, field: 'tonnage', 'error')} required">
	<label for="tonnage">
		<g:message code="weapon.tonnage.label" default="Tonnage" />
		<span class="required-indicator">*</span>
	</label>
	<g:field name="tonnage" type="number" value="${weaponInstance.tonnage}" required=""/>

</div>

<div class="fieldcontain ${hasErrors(bean: weaponInstance, field: 'crits', 'error')} required">
	<label for="crits">
		<g:message code="weapon.crits.label" default="Crits" />
		<span class="required-indicator">*</span>
	</label>
	<g:field name="crits" type="number" value="${weaponInstance.crits}" required=""/>

</div>

<div class="fieldcontain ${hasErrors(bean: weaponInstance, field: 'description', 'error')} required">
	<label for="description">
		<g:message code="weapon.description.label" default="Description" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="description" required="" value="${weaponInstance?.description}"/>

</div>

