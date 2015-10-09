
<p class="legend">Log in</p>
<form action='${request.contextPath}/j_spring_security_check' method='POST' id='loginForm' name='loginForm' class='form'>
	<p>
		<label for='username'>Login ID</label>
		<input type='text' class='text_' name='j_username' id='username' />
	</p>
	<p>
		<label for='password'>Password</label>
		<input type='password' class='text_' name='j_password' id='password' />
	</p>
	<p>
		<label for='remember_me'>Remember me</label>
		<input type='checkbox' class='chk' id='remember_me' name='_spring_security_remember_me'/>
	</p>
	<p>
		<div class="submit">
			<input type="image" src="/RogueMek/assets/login-button.gif" class="btn"/>
		</div>
	</p>
</form>