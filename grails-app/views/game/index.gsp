<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="game">
		<title>RogueMek</title>
	</head>
	<body id="body">
	
		<script type="text/javascript">var hpgTransport = "${grailsApplication.config.roguemek.server.hpgTransport}";</script>
		<script type="text/javascript">var currentUserId = "${userInstance?.id}";</script>
		
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
					<%-- show previous chat from database --%>
					<g:if test="${chatMessages}">
						<g:each in="${chatMessages}" var="thisChat">
							<div class="chat-line">
								<%-- TODO: figure out showing in the locale time style like Date.toLocaleTimeString in javascript --%>
								<span class="chat-time">[<g:formatDate format="h:mm:ss a" date="${thisChat.time}"/>]</span>
								<g:if test="${thisChat.user}"><span class="chat-user">${thisChat.user}:</span></g:if>
								<span class="chat-message">${thisChat.message}</span>
							</div>
						</g:each>
					</g:if>
				</div>
			    <div id="chat-users">
					<g:each in="${gameInstance?.users}" var="thisUser">
						<div data-chat-userid="${thisUser.id}"><span class="game-user">${thisUser.callsign}</span></div>
					</g:each>
				</div>
			</div>
		    <input id="chat-input" type="text"/>
	    </div>
	    
	</body>
</html>
