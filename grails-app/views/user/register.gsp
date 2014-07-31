<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<title>Registration</title>
	</head>
	<body id="body">
		<h1>Registration</h1>
		<p>Complete the form below to create an account!</p>
		<g:hasErrors bean="${user}">
			<div class="errors">
				<g:renderErrors bean="${user}"></g:renderErrors>
			</div>
		</g:hasErrors>
		
		<g:form action="register" name="registerForm">
			<div class="formField">
				<label for="login">Login Email:</label>
				<g:textField name="login" value="${user?.login}"/>
			</div>
			<div class="formField">
				<label for="callsign">Call Sign:</label>
				<g:textField name="callsign" value="${user?.callsign}"/>
			</div>
			<div class="formField">
				<label for="password">Password:</label>
				<g:passwordField name="password" value="${user?.password}"/>
			</div>
			<div class="formField">
				<label for="confirm">Confirm Password:</label>
				<g:passwordField name="confirm" value="${params?.confirm}"/>
			</div>
			<g:submitButton class="formButton" name="register" value="Register"></g:submitButton>
		</g:form>
	</body>
</html>