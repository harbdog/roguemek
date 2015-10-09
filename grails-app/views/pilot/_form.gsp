<%@ page import="roguemek.game.Pilot" %>



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

<div class="fieldcontain ${hasErrors(bean: pilotInstance, field: 'ownerUser', 'error')} required">
	<label for="ownerUser">
		<g:message code="pilot.ownerUser.label" default="Owner User" />
		<span class="required-indicator">*</span>
	</label>
	<g:select id="ownerUser" name="ownerUser.id" from="${roguemek.MekUser.list()}" optionKey="id" required="" optionValue="username" value="${pilotInstance?.ownerUser?.id}" class="many-to-one"/>

</div>

<div class="fieldcontain ${hasErrors(bean: pilotInstance, field: 'status', 'error')} required">
	<label for="status">
		<g:message code="pilot.status.label" default="Status" />
		<span class="required-indicator">*</span>
	</label>
	
	<g:radio name="status" value="${Pilot.STATUS_ACTIVE}" checked="${pilotInstance?.status == Pilot.STATUS_ACTIVE}"/>Active
	<g:radio name="status" value="${Pilot.STATUS_RETIRED}" checked="${pilotInstance?.status == Pilot.STATUS_RETIRED}"/>Retired
	<g:radio name="status" value="${Pilot.STATUS_DECEASED}" checked="${pilotInstance?.status == Pilot.STATUS_DECEASED}"/>Deceased

</div>

