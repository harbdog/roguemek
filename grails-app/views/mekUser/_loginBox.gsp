<g:if test="${params.action != 'auth'}">
	<div class="left" id="loginBox">
		<h1><g:message code="login.member.label" default="Already a member?" /></h1>
		<g:render template="/mekUser/loginForm" />
	</div>
</g:if>

<div class="right">
	<h1><g:message code="login.need.account.label" default="Need an account?" /></h1>
	<p class="legend"><g:message code="login.signup.label" default="Signup now to start playing!" /></p>
	<link:register><g:message code="login.register.now.label" default="Register now" /></link:register>
</div>
