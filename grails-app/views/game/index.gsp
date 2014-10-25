<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="game">
		<title>RogueMek</title>
	</head>
	<body id="body">
		
		<div id="canvasDiv">
			<div id="fpsDiv"></div>
			<canvas id="canvas">
		        <g:message code="page.browser.not.supported" />
		    </canvas>
		    
		    <div id="targetDiv"></div>
		    
		    <div id="controlDiv">
		    	<div id="weaponsDiv"></div>
		    	<div id="actionDiv">Fire</div>
	    	</div>
		    
		    <div id="playerDiv">
				<div id="infoDiv"></div>
				<div id="mapDiv"></div>
				<div id="statsDiv"></div>
				<div id="htalDiv"></div>
				<div id="heatDiv"></div>
			</div>
			
			<textarea id="messagingArea" readonly><g:message code="game.you.joined" /></textarea>
	    </div>
	    
	</body>
</html>