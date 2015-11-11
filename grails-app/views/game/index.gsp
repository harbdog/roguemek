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
			<div id="pingDiv"></div>
			<div id="fpsDiv"></div>
			<div id="dialogDiv"></div>
			<div id="loadingDiv"><div id="spinner" class="spinner"><g:message code="spinner.alt" default="Loading&hellip;"/></div></div>
			
			<canvas id="canvas">
		        <g:message code="page.browser.not.supported" />
		    </canvas>
		    
		    <textarea id="messagingArea" readonly><g:message code="game.you.joined" /></textarea>
	    </div>
	    
	</body>
</html>