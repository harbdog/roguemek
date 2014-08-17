<html>

<head>
	<meta name='layout' content='register'/>
	<title><g:message code='spring.security.ui.register.title'/></title>
</head>

<body>

<p/>

<s2ui:form width='650' height='300' elementId='loginFormContainer'
           titleCode='spring.security.ui.register.description' center='true'>

<g:form action='register' name='registerForm'>

	<g:if test='${emailSent}'>
	<br/>
	<g:message code='spring.security.ui.register.sent'/>
	</g:if>
	<g:else>

	<br/>

	<table>
	<tbody>
	
		<s2ui:textFieldRow name='username' bean="${command}" value="${command.username}"
		                   size='40' labelCode='user.username.label' labelCodeDefault='E-mail'/>

		<s2ui:textFieldRow name='callsign'  bean="${command}" value="${command.callsign}"
                         size='40' labelCode='user.callsign.label' labelCodeDefault='Call Sign'/>

		<s2ui:passwordFieldRow name='password' bean="${command}" value="${command.password}"
                             size='40' labelCode='user.password.label' labelCodeDefault='Password'/>

		<s2ui:passwordFieldRow name='password2' bean="${command}" value="${command.password2}"
                             size='40' labelCode='user.password2.label' labelCodeDefault='Confirm Password'/>

	</tbody>
	</table>

	<s2ui:submitButton elementId='create' form='registerForm' messageCode='spring.security.ui.register.submit'/>

	</g:else>

</g:form>

</s2ui:form>

<script>
$(document).ready(function() {
	$('#username').focus();
});
</script>

</body>
</html>
