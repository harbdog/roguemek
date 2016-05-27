<%@ page import="roguemek.MekUser"
		 import="roguemek.game.Game" 
		 import="roguemek.game.BattleUnit"
		 import="roguemek.game.BattleMech"
		 import="roguemek.game.StagingHelper"
%>

<!DOCTYPE html>
<html>
	<head>
		<meta name="layout" content="main">
		<asset:stylesheet src="staging.css"/>
		<asset:javascript src="staging.js"/>
		<title><g:message code="game.init.staging.label" /></title>
	</head>
	<body>
		<div id="mapSelectDiv"></div>
		<div id="mapPreviewDiv"></div>
		<div id="unitSelectDiv"></div>
		<div id="unitPreviewDiv"></div>
		<div id="camoSelectDiv"></div>
		<div id="loadingDiv"><div id="spinner" class="spinner"><g:message code="spinner.alt" default="Loading&hellip;"/></div></div>
		
		<g:if env="development">
			<%-- NOTE: client devMode should never be used to potentially give advantage, 
				 only to provide tools for development that do nothing for normal users --%>
		    <script type="text/javascript">var devMode = true;</script>
		</g:if>
		<g:else>
			<script type="text/javascript">var devMode = false;</script>
		</g:else>
		
		<script type="text/javascript">var hpgTransport = "${grailsApplication.config.roguemek.server.hpgTransport}";</script>
		<script type="text/javascript">var currentUserId = "${userInstance?.id}";</script>
		
		<g:set var="isEditable" value="${gameInstance?.ownerUser == userInstance && gameInstance?.isInit()}" />
		<script type="text/javascript">var playersEditable = ${isEditable};</script>
		<script type="text/javascript">var unitsEditable = ${gameInstance?.isInit()};</script>

		<div id="show-game" class="content scaffold-show" role="main">
			<h1><g:message code="game.init.staging.label" /> - ${gameInstance?.description}</h1>
			
			<g:if test="${gameInstance?.privateGame}">
				<div id="private-link">
					<span>Private Link: </span><input type="text" value='<g:createLink absolute="true" mapping="stagingGame" id="${gameInstance?.id}"></g:createLink>' readonly></input>
				</div>
			</g:if>
			
			<g:if test="${flash.message}">
				<div class="message" role="status">${flash.message}</div>
			</g:if>
			
			<div id="stagingError" class="errors" style="display: none"></div>
			
			<%-- using atmosphere meteor for chat --%>
			<div id="chat-area">
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
					<g:each in="${sortedUsers}" var="thisUser">
						<div data-chat-userid="${thisUser.id}"><span class="game-user">${thisUser.callsign}</span></div>
					</g:each>
				</div>
				<input id="chat-input" type="text"/>
			</div>
		</div>
		
		<div id="game-content">
			<div id="game-details" class="content scaffold-show" role="main">
				
				<g:if test="${gameInstance?.isInit()}">
					<g:set var="checkedReady" value="${StagingHelper.getStagingForUser(gameInstance, userInstance)?.isReady ? 'checked' : ''}" />
					<g:set var="readyTitle" value="${message(code: 'staging.game.user.ready.title')}" />
					<input type="checkbox" id="user-ready" ${checkedReady}>
					<label title="${readyTitle}" class="user-ready" for="user-ready"></label>
				</g:if>
				
				<ol class="property-list game">
				
					<li class="fieldcontain">
						<span id="owner-label" class="property-label"><g:message code="owner.label" default="Owner" /></span>
						
						<g:if test="${gameInstance?.ownerUser == userInstance}">
							<span class="property-value" aria-labelledby="owner-label"><g:message code="you.label" default="You" /></span>
						</g:if>
						<g:else>
							<span class="property-value" aria-labelledby="owner-label">${gameInstance?.ownerUser}</span>
						</g:else>
					</li>
				
					<g:if test="${gameInstance?.isInit()}">
						<%-- store the selected HexMap ID where the javascript can get to it later --%>
						<g:if test="${gameInstance?.board?.mapId()}">
							<script type="text/javascript">var selectedMapId = "${gameInstance?.board?.mapId()}";</script>
						</g:if>
						<g:else>
							<script type="text/javascript">var selectedMapId = null;</script>
						</g:else>
					
						<g:if test="${gameInstance?.board?.name() != null}">
							<g:set var="mapName" value="${gameInstance?.board?.toString()}" />
						</g:if>
						<g:else>
							<g:set var="mapName" value="${g.message(code: 'default.button.random.label')}" />
						</g:else>
						
						<li class="fieldcontain">
							<span id="map-label" class="property-label"><g:message code="map.label" default="Map" /></span>
							
							<g:if test="${gameInstance?.ownerUser == userInstance}">
								<button id="map-button" aria-labelledby="map-label">${mapName}</button>
							</g:if>
							<g:else>
								<button id="map-selected" class="property-value" aria-labelledby="map-label">${mapName}</button>
							</g:else>
						</li>
						
						<%-- show team selection dropdown menu --%>
						<g:set var="userInstanceTeamNum" value="${gameInstance.getTeamForUser(userInstance)}" />
						<%	// create map of team selections
							def teamSelections = [:]
							teamSelections[-1] = "No Team"	// TODO: i18n for this and following "Team #"
							(1..8).each {
								teamSelections[it] = "Team ${it}"	
							}
						%>
						<li class="fieldcontain">
							<span id="team-label" class="property-label"><g:message code="team.label" default="Team" /></span>
							
								<g:select from="${teamSelections.entrySet()}" name="team-select" optionKey="key" optionValue="value" value="${userInstanceTeamNum}"></g:select>
						</li>
					</g:if>
					<g:else>
						<li class="fieldcontain">
							<span id="map-label" class="property-label"><g:message code="map.label" default="Map" /></span>
							
								<span class="property-value" aria-labelledby="map-label">${gameInstance?.board?.toString()}</span>
						</li>
						
						<li class="fieldcontain">
							<span id="turn-label" class="property-label"><g:message code="turn.label" default="Turn" /></span>
							
								<span class="property-value" aria-labelledby="turn-label">${gameInstance?.gameTurn+1}</span>
						</li>
						
						<li class="fieldcontain">
							<span id="update-label" class="property-label"><g:message code="last.update.label" default="Last Update" /></span>
							
								<span class="property-value" aria-labelledby="update-label"><g:formatDate date="${gameInstance?.updateDate}"/></span>
						</li>
					</g:else>
					
				</ol>
			</div>
        
			<div id="teams">
				<g:if test="${gameInstance?.isInit() && stagingUsers != null}">
	                
	                <g:each in="${stagingUsers}" var="entry">
	                    <g:set var="teamNum" value="${entry.key}" />
	                    <g:set var="teamStagingUsers" value="${entry.value}" />
	                    
	                    <g:render template="stageTeam" model="[teamNum: teamNum, teamStagingUsers: teamStagingUsers]" />
	            	</g:each>
				</g:if>
				<g:else>
					<%  // display users grouped and identified with their team
						def usersByTeam = gameInstance?.getUsersByTeam()
						def unitsByUser = gameInstance?.getUnitsByUser(true)
					%>
					<g:each in="${usersByTeam}" var="entry">
						<g:set var="teamNum" value="${entry.key}" />
						<g:set var="teamUsers" value="${entry.value}" />
						
						<div class="team">
						    <div class="team-header">
						        <g:if test="${(teamNum >= 0)}">
						            <h2>Team ${teamNum}</h2>
						        </g:if>
						    </div>
						
							<g:each in="${teamUsers}" var="thisUser">
								<div class="player">
									<ol class="property-list game">
										
										<h3>
											${thisUser.callsign}
										</h3>
									
					                	<g:set var="unitList" value="${unitsByUser[thisUser.id]}" />
					                	
					                	<li class="fieldcontain">
					                		<span id="units-label" class="property-label"><g:message code="game.status.label" default="Status" /></span>
					                		
					                		<g:each in="${unitList}" var="unit">
					                			<g:set var="pilot" value="${unit.pilot}" />
					                			<span class="property-value" aria-labelledby="units-label">
					                				${unit.getHealthPercentage().round()}% : ${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}
					               				</span>
					                		</g:each>
					                	</li>
									</ol>
								</div>
							</g:each>
						</div>
					</g:each>
				</g:else>
			</div>
		</div>
		
		<div class="buttons">
			<g:if test="${gameInstance?.ownerUser == userInstance && gameInstance?.isInit()}">
				<span class="left" id="start-link" data-start-link="<g:createLink mapping='startGame' params='[game:gameInstance?.id]'></g:createLink>">
					<a href="#"><g:message code="default.button.init.battle.label" /></a>
				</span>
				
				<span class="right"><link:abortGame id="${gameInstance?.id}"><g:message code="default.button.abort.label" /></link:abortGame></span>
			</g:if>
			<g:else>
				<g:if test="${gameInstance?.isActive()}">
					<span class="left"><link:startGame game="${gameInstance?.id}"><g:message code="default.button.launch.label" /></link:startGame></span>
				</g:if>
				<g:else>
					<%-- For now, just a link just to refresh page --%>
					<span class="left"><link:stagingGame id="${gameInstance?.id}"><g:message code="default.button.waiting.label" /></link:stagingGame></span>
				</g:else>
				
				<span class="right" id="leave-link" data-leave-link="<g:createLink mapping='leaveGame' id='${gameInstance?.id}'></g:createLink>">
					<a href="#"><g:message code="default.button.leave.label" /></a>
				</span>
			</g:else>
		</div>
		
		<%-- Declaring some special case dialog purpose divs that initialize as not visible --%>
		<div id="user-leave-dialog" style="display:none;" title="${g.message(code: 'staging.game.leave.title')}">
			<div style='font-size:0.8em;'>${g.message(code: 'staging.game.leave.confirm')}</div>
		</div>
		<div id="user-remove-dialog" style="display:none;" title="${g.message(code: 'staging.game.remove.title')}">
			<div style='font-size:0.8em;'>${g.message(code: 'staging.game.remove.confirm')}</div>
		</div>
		<div id="launch-dialog" style="display:none;" title="${g.message(code: 'staging.game.started')}">
			<g:if test="${gameInstance?.ownerUser == userInstance}">
				<button id="launch-button"><g:message code="default.button.launching.label" /></button>
			</g:if>
			<g:else>
				<button id="launch-button"><link:startGame game="${gameInstance?.id}"><g:message code="default.button.launch.label" /></link:startGame></button>
			</g:else>
		</div>
	</body>
</html>
