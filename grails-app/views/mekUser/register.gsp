<%@ page import="roguemek.MekUser" 
%>

<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<title>Registration</title>
	</head>
	<body id="body">
		<g:if test="${( !grailsApplication.config.roguemek.users.admin?.username && MekUser.count() == 0) }">
			<%-- only appears because the first user to register needs to be a superuser/admin --%>
			<h1>Administrator Registration</h1>
			<p>Complete the form below to create the first administrator account</p>
		</g:if>
		<g:else>
			<h1>Registration</h1>
			<p>Complete the form below to create an account</p>
		</g:else>
		
		<g:hasErrors bean="${user}">
			<div class="errors">
				<g:renderErrors bean="${user}"></g:renderErrors>
			</div>
		</g:hasErrors>
		
		<g:form action="register" name="registerForm">
			<fieldset class="form">
				<div class="fieldcontain ${hasErrors(bean: user, field: 'callsign', 'error')} required">
					<label for="callsign">
						<g:message code="user.callsign.label" default="Callsign" />
						<span class="required-indicator">*</span>
					</label>
					<g:textField name="callsign" required="" value="${user?.callsign}" autocomplete="false" autofocus="true"/>
				</div>
				
				<div class="fieldcontain ${hasErrors(bean: user, field: 'username', 'error')} required">
					<label for="username">
						<g:message code="user.email.label" default="Email" />
						<span class="required-indicator">*</span>
					</label>
					<g:textField name="username" required="" value="${user?.username}" autocomplete="false"/>
				</div>
				<div class="fieldcontain ${hasErrors(bean: user, field: 'username', 'error')} required">
                    <label for=emailConfirm>
                        <g:message code="user.email.confirm.label" default="Confirm Email" />
                        <span class="required-indicator">*</span>
                    </label>
                    <g:textField name="emailConfirm" required="" value="${params?.emailConfirm}" autocomplete="false"/>
                </div>
				
				<div class="fieldcontain ${hasErrors(bean: user, field: 'password', 'error')} required">
					<label for="password">
						<g:message code="user.password.label" default="Password" />
						<span class="required-indicator">*</span>
					</label>
					<g:passwordField name="password" required="" value="${user?.password}" autocomplete="false"/>
				</div>
				<div class="fieldcontain ${hasErrors(bean: user, field: 'password', 'error')} required">
					<label for="confirm">
						<g:message code="user.password.confirm.label" default="Confirm Password" />
						<span class="required-indicator">*</span>
					</label>
					<g:passwordField name="confirm" required="" value="${params?.confirm}" autocomplete="false"/>
				</div>
			</fieldset>
			
			<fieldset class="buttons">
				<g:submitButton class="register" name="register" value="Register"></g:submitButton>
			</fieldset>
		</g:form>
	</body>
</html>