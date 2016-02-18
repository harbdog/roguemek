<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<title>Registration</title>
	</head>
	<body id="body">
		<h1>Registration</h1>
		<p>Complete the form below to create an account</p>
		<g:hasErrors bean="${user}">
			<div class="errors">
				<g:renderErrors bean="${user}"></g:renderErrors>
			</div>
		</g:hasErrors>
		
		<g:form action="register" name="registerForm">
			<fieldset class="form">
				<div class="fieldcontain ${hasErrors(bean: user, field: 'username', 'error')} required">
					<label for="username">
						<g:message code="user.email.label" default="Email" />
						<span class="required-indicator">*</span>
					</label>
					<g:textField name="username" required="" value="${user?.username}"/>
				</div>
				<div class="fieldcontain ${hasErrors(bean: user, field: 'callsign', 'error')} required">
					<label for="callsign">
						<g:message code="user.callsign.label" default="Callsign" />
						<span class="required-indicator">*</span>
					</label>
					<g:textField name="callsign" required="" value="${user?.callsign}"/>
				</div>
				<div class="fieldcontain ${hasErrors(bean: user, field: 'password', 'error')} required">
					<label for="password">
						<g:message code="user.password.label" default="Password" />
						<span class="required-indicator">*</span>
					</label>
					<g:passwordField name="password" required="" value="${user?.password}"/>
				</div>
				<div class="fieldcontain ${hasErrors(bean: user, field: 'password', 'error')} required">
					<label for="confirm">
						<g:message code="user.confirm.label" default="Confirm" />
						<span class="required-indicator">*</span>
					</label>
					<g:passwordField name="confirm" required="" value="${params?.confirm}"/>
				</div>
			</fieldset>
			
			<fieldset class="buttons">
				<g:submitButton class="register" name="register" value="Register"></g:submitButton>
			</fieldset>
		</g:form>
	</body>
</html>