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
			<div id="settingsDiv"></div>
			
			<div id="loadingDiv"><div id="spinner" class="spinner"><g:message code="spinner.alt" default="Loading&hellip;"/></div></div>
			<div id="progressDiv"><div id="progressBar"></div></div>
			
			<canvas id="canvas">
		        <g:message code="page.browser.not.supported" />
		    </canvas>
		    
		    <div id="messagingArea">
		    	<div id="chat-window">
					<%-- TODO: retrieve previous chat from database --%>
				</div>
			    <div id="chat-users">
					<g:each in="${chatUsers}" var="thisUser">
						<div data-chat-userid="${thisUser.id}"><span class="chat-user">${thisUser}</span></div>
					</g:each>
				</div>
			</div>
		    <input id="chat-input" type="text"/>
	    </div>
	    
	</body>
</html>