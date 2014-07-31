<!DOCTYPE html>
<!--[if lt IE 7 ]> <html lang="en" class="no-js ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="no-js ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="no-js ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html lang="en" class="no-js"><!--<![endif]-->
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title><g:layoutTitle default="Grails"/></title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="shortcut icon" href="${assetPath(src: 'favicon.ico')}" type="image/x-icon">
		<link rel="apple-touch-icon" href="${assetPath(src: 'apple-touch-icon.png')}">
		<link rel="apple-touch-icon" sizes="114x114" href="${assetPath(src: 'apple-touch-icon-retina.png')}">
  		<asset:stylesheet src="application.css"/>
		<asset:javascript src="application.js"/>
		<g:layoutHead/>
	</head>
	<body>
		<div id="grailsLogo" role="banner"><a href="http://grails.org"><asset:image src="grails_logo.png" alt="Grails"/></a></div>
		
		<div id="loginBox" class="loginBox">
			<g:if test="${params.action == 'register'}">
				<%-- Hide login box while registering --%>
			</g:if>
			<g:elseif test="${session?.user}">
				<div style="margin-top:20px">
					<div style="float:right;">
						<g:link controller="user" action="profile">Profile</g:link> | <g:link controller="user" action="logout">Logout</g:link><br>
					</div>
					Welcome back
					<span id="userCallSign">
						${session?.user?.callsign}!
					</span><br><br>
					
					<%-- You own (${session.user.ownedMechs?.size() ?: 0}) Mechs.<br> --%>
				</div>
			</g:elseif>
			<g:else>
			<g:form name="loginForm"
					url="[controller:'user', action:'login']">
				<div>Email:</div>
				<g:textField name="login"
							 value="${fieldValue(bean:loginCmd, field:'login')}"/>
				
				<div>Password:</div>
				<g:passwordField name="password"/>
				<br/>
				<input type="image"
					   src="${createLinkTo(dir:'images', file:'login-button.gif')}"
					   name="loginButton" id="loginButton"></input>
			</g:form>
			<g:renderErrors bean="${loginCmd}"></g:renderErrors>
			</g:else>
		</div>
		
		<div id="navPane">
			<g:if test="${params.action == 'register'}">
				<%-- Hide login box while registering --%>
			</g:if>
			<g:elseif test="${session.user}">
				<ul>
					<li><g:link controller="user"
								action="mechs">My Mechs</g:link></li>
					<li><g:link controller="mech"
								action="index">List Mechs</g:link></li>
				</ul>
			</g:elseif>
			<g:else>
				<div id="registerPane">
					Need an account?
					<g:link controller="user"
							action="register">Register now!</g:link>
				</div>
			</g:else>
		</div>
		
		<g:layoutBody/>
		<div class="footer" role="contentinfo"></div>
		<div id="spinner" class="spinner" style="display:none;"><g:message code="spinner.alt" default="Loading&hellip;"/></div>
	</body>
</html>
