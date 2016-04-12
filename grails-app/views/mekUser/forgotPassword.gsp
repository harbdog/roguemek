<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<title>Forgot Password</title>
	</head>
	<body id="body">
		<h1>Forgot Password</h1>
		<p>Enter your login Email address to have a reset password link sent</p>
		<g:hasErrors bean="${user}">
			<div class="errors">
				<g:renderErrors bean="${user}"></g:renderErrors>
			</div>
		</g:hasErrors>
		
		<g:form action="forgotPassword" name="forgotForm">
			<fieldset class="form">
				<div class="fieldcontain ${hasErrors(bean: user, field: 'username', 'error')} required">
					<label for="username">
						<g:message code="user.email.label" default="Email" />
					</label>
					<g:textField name="username" required="" value="${user?.username}" autocomplete="false" autofocus="true"/>
				</div>
			</fieldset>	
			
			<fieldset class="buttons">
				<g:submitButton class="forgot" name="forgot" value="Send"></g:submitButton>
			</fieldset>
		</g:form>
	</body>
</html>