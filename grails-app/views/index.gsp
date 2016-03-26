<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="main">
		<title>RogueMek</title>
	</head>
	<body id="body">
	
		<sec:ifLoggedIn>
			<%-- high scores board only appears when logged in --%>
			<g:render template="/rogueMek/highScores" />
		</sec:ifLoggedIn>
		<sec:ifNotLoggedIn>
			<%-- main page content that only appears when not logged in --%>
			<div class="top-login-register-info">
				<p class="center">To get started playing, <link:login><g:message code="login.label" default="Login" /></link:login> to an existing account or <link:register><g:message code="register.label" default="Register" /></link:register> to create a new account on this host</p>
			</div>
		</sec:ifNotLoggedIn>
		
		<div class="front-header">
			<h1>${grailsApplication.config.roguemek.server.headerMessage}</h1>
		</div>
		
		<%-- main page content that always appears whether logged in or not --%>
		<div class="front">
			<p>
				RogueMek is a turn-based game that you can play in your web browser. This release highlights the following features:
			</p>
			<ul>
				<li>2D Animated unit movement and weapons fire</li>
				<li>Player versus Player (PvP) game play (no PvE or Co-op... yet)</li>
				<li>Free For All game mode (no teams... yet)</li>
				<li>Win/Loss and Kill/Death tracking (with front page leaderboard)</li>
				<li>Battle log recording (no replays... yet)</li>
				<li>90+ stock 3025 era Inner Sphere units and technology (no Clans or customization... yet)</li>
				<li>30+ maps to wage battle on (no board previews or custom boards... yet)</li>
			</ul>
			<br/>
		</div>
		
		<div class="bottom"><a id="about"></a>
			<h1>About RogueMek</h1>
			<p>
				RogueMek is an unofficial online web browser game based on the <a href="http://bg.battletech.com/" target="_blank">BattleTech</a> board game, using shared assets created by <a href="http://megamek.info/" target="_blank">MegaMek</a>.
				RogueMek is open source, free software licensed under the <a href="http://www.gnu.org/licenses/licenses.html" target="_blank">GPL</a>. The source code is hosted on <a href="https://github.com/harbdog/roguemek" target="_blank">GitHub</a>.
			</p>
			<p>Browser Requirements:</p>
			<ul>
				<li>Personal Computer or Tablet - Phone sized displays not currently supported</li>
				<li>An <a href="https://html5test.com/" target="_blank">HTML5</a> compatible browser - <a href="https://www.google.com/chrome/" target="_blank">Chrome</a> recommended</li>
			</ul>
		</div>
	</body>
</html>