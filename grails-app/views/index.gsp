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
			<p>Bacon ipsum dolor amet pig sirloin ground round, salami ribeye chuck ham flank meatball kevin beef ribs andouille. Leberkas boudin shank, tongue pig pancetta tri-tip chicken ham salami picanha prosciutto meatball. Tri-tip kevin meatloaf, t-bone pork chop pig beef ribs hamburger tenderloin pancetta. Tongue landjaeger shank, venison beef flank brisket strip steak doner sirloin ball tip. Ham hock salami shoulder, jowl pork belly pig corned beef drumstick ribeye ball tip chicken prosciutto. Turkey chuck cow hamburger pancetta chicken jowl alcatra sirloin shank meatball pig filet mignon porchetta. Pork ball tip flank, chuck pork belly ham pig prosciutto beef shankle turducken jerky rump porchetta swine.
			</p><br/>
			<p>Andouille salami landjaeger, ball tip pig shoulder chicken sausage doner chuck. Beef meatloaf landjaeger cupim. Pastrami shoulder tail drumstick flank jowl. Frankfurter hamburger kevin ham ribeye cupim. Cupim leberkas capicola corned beef. Beef ribs ham ground round biltong turducken flank, ribeye filet mignon pork belly swine spare ribs kielbasa pastrami short ribs short loin. Ground round hamburger cupim sirloin, cow corned beef rump chicken pork belly meatball pork ham hock swine andouille.
			</p><br/>
			<p>Bresaola venison kevin, andouille shank jowl prosciutto drumstick. Ham boudin corned beef filet mignon beef pork belly, tenderloin frankfurter tongue. Ground round kielbasa salami, jowl chicken picanha flank tongue chuck short loin pork loin bresaola turducken porchetta. Bresaola sausage short loin turkey shankle strip steak tenderloin leberkas salami. Alcatra drumstick brisket boudin capicola jerky short loin chicken venison ham shankle prosciutto meatloaf sausage ball tip.
			</p><br/>
			<p>Fatback bresaola tail alcatra jerky rump landjaeger beef tenderloin boudin short loin turducken picanha. Leberkas ham corned beef turkey kielbasa strip steak t-bone. Salami rump jerky beef. Chicken spare ribs chuck t-bone tongue ham brisket bresaola boudin turkey swine.
			</p><br/>
			<p>Boudin pastrami brisket chicken tail tongue. Hamburger t-bone shank brisket sausage short ribs short loin meatloaf picanha beef ribs tail landjaeger bacon cupim. Tongue pork belly boudin fatback. Andouille turducken salami, venison ribeye shank picanha kevin chicken ground round cupim. Andouille chicken ball tip pork loin pork ribeye. Landjaeger venison andouille ribeye tri-tip, fatback boudin t-bone rump pork.
			</p><br/>
		</div>
		
		<div class="bottom"><a id="about"></a>
			<h1>About RogueMek</h1>
			<p>
				RogueMek is an unofficial online web browser game based on the <a href="http://bg.battletech.com/" target="_blank">BattleTech</a> board game, using shared assets created by <a href="http://megamek.info/" target="_blank">MegaMek</a>.
				RogueMek is open source, free software licensed under the <a href="http://www.gnu.org/licenses/licenses.html" target="_blank">GPL</a>.
			</p>
			<p>Browser Requirements:</p>
			<ul>
				<li>Personal Computer or Tablet - Phone sized displays not currently supported</li>
				<li>An <a href="https://html5test.com/" target="_blank">HTML5</a> compatible browser - <a href="https://www.google.com/chrome/" target="_blank">Chrome</a> recommended</li>
				
			</ul>
		</div>
	</body>
</html>