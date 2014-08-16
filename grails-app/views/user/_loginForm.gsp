
<p class="legend">Log in</p>
<g:form name="loginForm" url="[controller:'login', action:'auth']" class="form">
	<div class="input">
		<g:textField required="true"
					 placeholder="Email"
					 name="username"
					 value="${fieldValue(bean:loginCmd, field:'username')}" />
		<g:hasErrors bean="${loginCmd}" field="username" >
			<p class="error"><g:fieldError bean="${loginCmd}" field="username" /></p>
		</g:hasErrors>
	</div>
	<div class="input">
		<g:passwordField required="true"
						 placeholder="Password"
						 name="password" />
		<g:hasErrors bean="${loginCmd}" field="password">
			<p class="error"><g:fieldError bean="${loginCmd}" field="password" /></p>
		</g:hasErrors>
	</div>
	<div class="submit">
		<input type="image" src="/RogueMek/assets/login-button.gif" class="btn"/>
	</div>
</g:form>