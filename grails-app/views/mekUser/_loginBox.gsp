<div class="nav" role="navigation">
	<ul>
		<div class="right">
			<g:if test="${params.action != 'auth'}">
				<li><link:login><g:message code="login.label" default="Login" /></link:login></li>
			</g:if>
			<g:if test="${params.action != 'register'}">
				<li><link:register><g:message code="register.label" default="Register" /></link:register></li>
			</g:if>
		</div>
	</ul>
</div>