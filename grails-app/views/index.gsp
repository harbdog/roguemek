<%@ page import="roguemek.MekUser" 
%>

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
			<g:if test="${( !grailsApplication.config.roguemek.users.admin?.username && MekUser.count() == 0) }">
				<%-- main page content that only appears because the first user to register needs to be a superuser/admin --%>
				<div class="top-login-register-info">
					<p class="center" style="font-size: 1.5em;">To get started, <link:register><g:message code="register.label" default="Register" /></link:register> to create the first administrator account on this host</p>
				</div>
			</g:if>
			<g:else>
				<%-- main page content that only appears when not logged in --%>
				<div class="top-login-register-info">
					<p class="center">To get started playing, <link:login><g:message code="login.label" default="Login" /></link:login> to an existing account or <link:register><g:message code="register.label" default="Register" /></link:register> to create a new account on this host</p>
				</div>
			</g:else>
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
				<li>2D Animated unit movement and weapons fire (no sound effects... yet)</li>
				<li>Player versus Player (PvP) game play (no PvE or Co-op... yet)</li>
				<li>Free For All game mode (no teams... yet)</li>
				<li>Win/Loss and Kill/Death tracking (with front page leaderboard)</li>
				<li>Battle log recording (no replays... yet)</li>
				<li>90+ stock 3025 era Inner Sphere units and technology (no Clans or customization... yet)</li>
				<li>30+ maps to wage battle on (no custom boards... yet)</li>
			</ul>
			<br/>
			
			<p style="text-align:center;">
				<a href="${assetPath(src: 'samples/sample_game_ui.png')}" target="_blank"><asset:image src="samples/sample_game_ui_400px.png" title="Click to show full resolution example gameplay image" style="border:2px solid #3498DB;" /></a>
			</p>
			<br/>
			
			<h1>Starting a Battle</h1>
			<p>
				After logging in, you will have access to the <asset:image src="ui/dropship.png" title="The Dropship" height="20px"/> Dropship, where you will be able to view, create, and join battles.
			</p>
			<ul>
				<li>Any battles you are already part of will be listed, along with past battles that have already concluded</li>
				<li>You can create a Public or Private battle, the latter can only be joined by sending the link provided after creation</li>
				<li>Selecting the join option will list all public battles currently in the planning stage</li>
			</ul>
			<br/>
			<p>
				Once you have joined a battle, you will be able to select your starting location on the map <asset:image src="samples/sample_location_nw.png" title="Starting location button" height="20px"/>.
				If you created the battle, you will also be able to select the map <asset:image src="samples/sample_map.png" title="Map selection button" height="20px"/>.
			</p>
			<br/>
			<p>
				Then you can select the units <asset:image src="samples/sample_add_unit.png" title="Add unit button" height="20px"/> that you want to bring in to battle <asset:image src="samples/sample_unit.png" title="Example unit" height="25px"/>,
				and pick your team camo color <asset:image src="samples/sample_camo.png" title="Camo selection button" height="20px"/>.
			</p>
			<br/>
			<p>
				When you are finished setting up, each combatant will need to click their Not Ready <asset:image src="samples/sample_not_ready.png" title="Not ready icon" height="25px"/> button to switch it over to Ready <asset:image src="samples/sample_ready.png" title="Ready icon" height="25px"/> status.
				If you created the battle, you will only be able to launch it after all combatants are ready <asset:image src="samples/sample_initiate.png" title="Start battle button" height="20px"/>.
			</p>
			<br/>
			
			<h1>Combat Interface</h1>
			<p>
				The interface contains several key elements:
			</p>
			<ul>
				<li>Settings and Chat buttons at the top left <em>(pictured below)</em></li>
				<li>Chat and battle log at the top center <em>(pictured below)</em></li>
				<li>Combatants currently in the battle at the top right <em>(pictured below)</em></li>
				<li>Unit movement controls on the left (only appears when it is their turn)</li>
				<li>Friendly unit info and weapons at the bottom left</li>
				<li>Enemy unit info at the bottom right</li>
			</ul>
			<br/>
			
			<asset:image src="samples/sample_chat_area.png" title="Settings and Chat area" />
			<br/>
			
			<h1>Playing the game</h1>
			<p>
				Each unit will take turns performing their movement and weapons fire actions.
				These turns are taken in an order determined by the initiative roll for each unit, which occurs at the start of the battle and every 4th cycle of turns.
				While the initiative is randomized, it favors faster units.
			</p>
			<br/>
			
			<p class="content-image-left">
				<asset:image src="samples/sample_unit_controls.png" title="Movement buttons" />
				The movement buttons will appear only when it is that player's unit turn.
				The larger number inside the center rectangle/circle button represents the remaining amount of Action Points (AP).
				Clicking on the center button will end the current turn, only firing weapons if there were weapons selected to have turned it into a rectangle.
				<br/><br/>
				The other directional buttons indicate the AP cost to move/turn in that direction, and clicking on them will perform that action.
			</p>
			<br/>
			
			<p class="content-image-right">
				If the unit is equipped with jump jets, another button will appear on top, allowing the unit to jump (only if it does so at the beginning of its turn).
				Once enabled, the unit may rotate at no AP cost, and move the number of hexes indicated by the number inside the jump button.
				<asset:image src="samples/sample_jump_control.png" title="Jump button" />
			</p>
			<br/>
			
			<p>The player unit list shows all units currently controlled by the player, and detailed information about the status of the current unit.</p>
			<p class="content-image-left">
				<asset:image src="samples/sample_unit_info.png" title="Player unit list and current unit information" />
				The top section displays the name of the unit and any active effects currently applied to it (such as being prone, or being negatively affected by heat).
				Clicking on this section will load a dialog containing detailed statistics and critical slots for the unit.
				<br/><br/>
				The middle section display the heat levels of the unit, including the Heat Generation and Heat Dissipation (GEN/DISS) for the current turn.
				<br/><br/>
				The bottom section displays the Head-Torsos-Arms-Legs (HTAL) armor and internal structure diagram.
				<br/><br/> 
			</p>
			<br/>
			
			<p class="content-image-both">
				<asset:image src="samples/sample_unit_target.png" title="Enemy targeted" />
				Clicking on an enemy unit during your turn will target it, and its information display will appear on the right side of the interface.
				<br/><br/>
				The only difference between this and the player unit display is the enemy display will not show you its heat levels. In its place you will be shown the list of its weapons.
				<br/><br/>
				Additionally, any of your weapons currently selected to fire will be indicated in the bracket surrounding the selected target.
				<asset:image src="samples/sample_target_info.png" title="Enemy target unit information" />
			</p>
			<br/>
			
			<p>When an enemy unit is targeted, the weapons display will appear.</p>
			<p class="content-image-left">
				<asset:image src="samples/sample_weapons.png" title="Weapons display" />
				<span style="line-height: 1.25em">
					Each weapon entry will display the location of the weapon, an icon indicating the type of weapon
					(Ballistic <asset:image src="ui/ballistics.png" title="Ballistic icon" style="margin-bottom: 0px"/>,
					Energy <asset:image src="ui/laser.png" title="Energy icon" style="margin-bottom: 0px"/>,
					Missile <asset:image src="ui/missiles.png" title="Missile icon" style="margin-bottom: 0px"/>,
					or Melee <asset:image src="ui/melee.png" title="Melee icon" style="margin-bottom: 0px"/>),
					the remaining amount of ammo (if applicable), and the chance to hit the target (as a %).
				</span>
			</p>
			<br/>
			<p>
				The following factors influence the % chance to hit a target:
			</p>
			<ul>
				<li>Range - weapons have varying minimum and maximum ranges</li>
				<li>Terrain Modifiers - trees and other obstruction</li>
				<li>Unit Speed - walking and running</li>
				<li>Target Speed - the number of hexes the enemy target moved during its last turn</li>
			</ul>
			<br/>
			<p>
				After your weapon selections have been made, press the center rectangle control to fire all selected weapons at the target.
			</p>
			<br/>
			
			<p>
				If you wish to end your turn without firing any weapons, make sure no weapons are selected and press the center circle control to immediately end the turn.
				The turn will also automatically end if you use all of your AP for movement.
			</p>
			<br/>
			
			<h1>Notes</h1>
			<ul>
				<li>There is currently no in-game explanation of the various weapon statistics (see the <a href="https://github.com/harbdog/roguemek/wiki/Weapons-Cheatsheet" target="_blank">Wiki</a>)</li>
				<li>There is currently no torso twisting in this game</li>
				<li>The isometric view can be toggled off in Settings, in case it gets in the way of things</li>
				<li>If you would like to report a bug, please use the <a href="https://github.com/harbdog/roguemek/issues" target="_blank">issue tracker on GitHub</a>.</li>
				<li>There is also a <a href="https://github.com/harbdog/roguemek/wiki" target="_blank">Wiki on GitHub</a>.</li>
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
			<p>
				The prototype version of RogueMek can still be played as part of the <a href="http://minimek.sourceforge.net/" target="_blank">MiniMek</a> collection of open source games.
			</p>
		</div>
	</body>
</html>