<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="game">
		<title>RogueMek</title>
	</head>
	<body id="body">
		<div id="playerDiv">
			<div id="infoDiv"></div>
			<div id="mapDiv"></div>
			<div id="statsDiv"></div>
			<div id="htalDiv"></div>
			<div id="heatDiv"></div>
		</div>
		<div id="canvasDiv">
			<canvas id="canvas">
		        Your browser dosen't support HTML5, upgrade to a recent browser version!
		    </canvas>
		    
		    <div id="fpsDiv"></div>
	    </div>
	</body>
</html>