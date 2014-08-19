<%@ page import="roguemek.model.Pilot" %>



<div class="fieldcontain ${hasErrors(bean: pilotInstance, field: 'firstName', 'error')} required">
	<label for="firstName">
		<g:message code="pilot.firstName.label" default="First Name" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="firstName" required="" value="${pilotInstance?.firstName}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: pilotInstance, field: 'lastName', 'error')} required">
	<label for="lastName">
		<g:message code="pilot.lastName.label" default="Last Name" />
		<span class="required-indicator">*</span>
	</label>
	<g:textField name="lastName" required="" value="${pilotInstance?.lastName}"/>

</div>

<div class="fieldcontain ${hasErrors(bean: pilotInstance, field: 'status', 'error')} required">
	<label for="status">
		<g:message code="pilot.status.label" default="Status" />
		<span class="required-indicator">*</span>
	</label>
	
	<g:radio name="status" value="A" checked="${pilotInstance?.status == 'A'}"/>Active
	<g:radio name="status" value="R" checked="${pilotInstance?.status == 'R'}"/>Retired
	<g:radio name="status" value="D" checked="${pilotInstance?.status == 'D'}"/>Deceased
	
</div>

<div class="fieldcontain ${hasErrors(bean: pilotInstance, field: 'ownedMechs', 'error')} ">
	<label for="ownedMechs">
		<g:message code="pilot.ownedMechs.label" default="Owned Mechs" />
		
	</label>
	
	<g:select name="ownedMechs" from="${roguemek.model.Mech.list()}" multiple="multiple" optionKey="id" size="5" optionValue="${{it?.name+" "+it?.chassis+"-"+it?.variant}}" value="${pilotInstance?.ownedMechs*.id}" class="many-to-many"/>

</div>

