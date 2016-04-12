<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<title>Password Update</title>
	</head>
	<body id="body">
		<h1>Set New Password</h1>
		<g:hasErrors bean="${user}">
			<div class="errors">
				<g:renderErrors bean="${user}"></g:renderErrors>
			</div>
		</g:hasErrors>
		
		<g:if test="${confirmCode}">
			<g:set var="formParams" value="[id: confirmCode]"/>
		</g:if>
		<g:else>
			<g:set var="formParams" value="" />
		</g:else>
		
		<g:form action="updatePassword" name="passwordForm" params="${formParams}">
			<fieldset class="form">
				<div class="formField fieldcontain">
					<label for="username"><g:message code="user.email.label" default="Email" /></label>
					<span>${user?.username}</span>
				</div>
				<div class="formField fieldcontain">
					<label for="callsign"><g:message code="user.callsign.label" default="Callsign" /></label>
					<span>${user?.callsign}</span>
				</div>
				<div class="formField fieldcontain ${hasErrors(bean: user, field: 'password', 'error')} required">
					<label for="password">
						<g:message code="user.password.label" default="Password" />
						<span class="required-indicator">*</span>
					</label>
					<g:passwordField name="password" value=""/>
				</div>
				<div class="formField fieldcontain ${hasErrors(bean: user, field: 'password', 'error')} required">
					<label for="confirm">
						<g:message code="user.password.confirm.label" default="Confirm Password" />
						<span class="required-indicator">*</span>
					</label>
					<g:passwordField name="confirm" value=""/>
				</div>
			</fieldset>
			
			<fieldset class="buttons">
				<g:submitButton class="formButton" name="updatePassword" value="Update"></g:submitButton>
			</fieldset>
		</g:form>
	</body>
</html>