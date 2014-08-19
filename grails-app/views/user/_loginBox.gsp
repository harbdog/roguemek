<div class="left">
	<h1>Need an account?</h1>
	<p class="legend">Signup now to start playing!</p>
	<g:link controller="user" action="register" class="btn">Register now</g:link>
</div>
<g:if test="${params.action != 'auth'}">
	<div class="right" id="loginBox">
		<h1>Already a member?</h1>
		<g:render template="/user/loginForm" />
	</div>
</g:if>