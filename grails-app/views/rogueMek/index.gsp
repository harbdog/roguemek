<%@ page import="roguemek.game.BattleMech" %>

<% 
	def ownerPilot = game?.ownerPilot
%>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="game">
		<title>RogueMek - ${ownerPilot}</title>
	</head>
	<body id="body">
		<canvas id="canvas" width="500" height="300">
	        Your browser dosen't support HTML5, upgrade to a recent browser version!
	    </canvas>
	</body>
</html>