<!DOCTYPE html>
<!--[if lt IE 7 ]> <html lang="en" class="no-js ie6"> <![endif]-->
<!--[if IE 7 ]>    <html lang="en" class="no-js ie7"> <![endif]-->
<!--[if IE 8 ]>    <html lang="en" class="no-js ie8"> <![endif]-->
<!--[if IE 9 ]>    <html lang="en" class="no-js ie9"> <![endif]-->
<!--[if (gt IE 9)|!(IE)]><!--> <html lang="en" class="no-js"><!--<![endif]-->
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title><g:layoutTitle default="RogueMek"/></title>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		
		<link rel="shortcut icon" href="${assetPath(src: 'marauder.ico')}" type="image/x-icon">
		<link rel="apple-touch-icon" href="${assetPath(src: 'marauder-touch-icon.png')}">
		<link rel="apple-touch-icon" sizes="100x100" href="${assetPath(src: 'marauder-touch-icon-retina.png')}">
		
  		<asset:stylesheet src="application.css"/>
		<asset:javascript src="application.js"/>
		
		<tz:detect />
		
		<g:layoutHead/>
	</head>
	<body>
		<a id="top"></a>
		<div id="grailsLogo" role="banner"><g:link uri="/"><asset:image src="roguemek_logo.png" alt="RogueMek"/></g:link></div>
		
		<div id="loginBox" class="loginBox">
			<sec:ifLoggedIn>
				<g:render template="/mekUser/loginLanding" />
			</sec:ifLoggedIn>
      		<sec:ifNotLoggedIn>
				<g:render template="/mekUser/loginBox" />
			</sec:ifNotLoggedIn>
		</div>
		
		<g:layoutBody/>
		
		<div class="footer" role="contentinfo">
			<span id="backtotop"><a href="#top"><g:message code="default.page.top.label"/></a></span>
			<div id="version" class="right">
				<g:set var="vText" value="v${grailsApplication.metadata.'app.version'}"/>
				<g:meta name="app.name"/>
				<a href="https://github.com/harbdog/roguemek/releases/tag/${vText}" target="_blank">${vText}</a>
			</div>
		</div>
		<div id="spinner" class="spinner" style="display:none;"><g:message code="spinner.alt" default="Loading&hellip;"/></div>
		
		<asset:deferredScripts/>
	</body>
</html>
