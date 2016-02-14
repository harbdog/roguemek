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
		
		<g:form action="updatePassword" name="passwordForm" params="[id: user?.confirmCode]">
			<div class="formField">
				<label for="username">Email:</label>
				<span>${user?.username}</span>
			</div>
			<div class="formField">
				<label for="callsign">Call Sign:</label>
				<span>${user?.callsign}</span>
			</div>
			<div class="formField">
				<label for="password">Password:</label>
				<g:passwordField name="password" value=""/>
			</div>
			<div class="formField">
				<label for="confirm">Confirm Password:</label>
				<g:passwordField name="confirm" value=""/>
			</div>
			<g:submitButton class="formButton" name="password" value="Update"></g:submitButton>
		</g:form>
	</body>
</html>