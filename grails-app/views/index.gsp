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
			
			<h1>Playing the Game</h1>
			<p>
				After logging in, you will have access to the <asset:image src="ui/dropship.png" height="20px"/> Dropship, where you will be able to view, create, and join battles.
			</p>
			<ul>
				<li>Any battles you are already part of will be listed, along with past battles that have already concluded</li>
				<li>You can create a Public or Private battle, the latter can only be joined by sending the link provided after creation</li>
				<li>Selecting the join option will list all public battles currently in the planning stage</li>
			</ul>
			<br/>
			<p>
				Once you have joined a battle, you will be able to select your starting location on the map <asset:image src="samples/sample_location_nw.png" height="20px"/>.
				If you created the battle, you will also be able to select the map <asset:image src="samples/sample_map.png" height="20px"/>.
			</p>
			<br/>
			<p>
				Then you can select the units <asset:image src="samples/sample_add_unit.png" height="20px"/> that you want to bring in to battle <asset:image src="samples/sample_unit.png" height="25px"/>,
				and pick your team camo color <asset:image src="samples/sample_camo.png" height="20px"/>.
			</p>
			<br/>
			<p>
				When you are finished setting up, each combatant will need to click their Not Ready <asset:image src="samples/sample_not_ready.png" height="25px"/> button to switch it over to Ready <asset:image src="samples/sample_ready.png" height="25px"/> status.
				If you created the battle, you will then be able to start it after all combatants are ready <asset:image src="samples/sample_initiate.png" height="20px"/>.
			</p>
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
			<p>
				The prototype version of RogueMek can still be played as part of the <a href="http://minimek.sourceforge.net/" target="_blank">MiniMek</a> collection of open source games.
			</p>
		</div>
	</body>
</html>