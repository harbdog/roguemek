<%@ page import="roguemek.game.Game" %>

<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="main">
		<title>RogueMek</title>
	</head>
	<body id="body">
	    <g:if test="${flash.message}">
            <div class="message" role="status">${flash.message}</div>
        </g:if>
        
        <g:if test="${mekUserInstance?.callsign}">
            <h1 class="greeting"><g:message code="default.greeting.label" args="[mekUserInstance.callsign]" /></h1>
        </g:if>
        
		<div id="show-battles" class="content scaffold-show" role="main">
			<h1>Battles</h1>
			
			<div class="nav subnav">
				<g:set var="battleName" value="${message(code: 'battle.label', default: 'Battle')}" />
				<ul>
					<li><g:link class="create" action="create"><g:message code="default.new.label" args="[battleName]" /></g:link></li>
					<li><g:link class="join" action="join"><g:message code="default.join.label" args="[battleName]" /></g:link></li>
				</ul>
			</div>
			
			<ul class="property-list user">
			<g:if test="${mekUserInstance?.pilots}">
			<%
                // find all games owned by the user and that the user's pilots are in
                def gameList
				
				def initGames = []
				def activeGames = []
				def pausedGames = []
				def finishedGames = []
				
				def o = Game.createCriteria()
				def ownedGames = o.listDistinct {
					eq("ownerUser", mekUserInstance)
					order("updateDate", "desc")
				}
				
				for(Game g in ownedGames) {
					if(Game.GAME_INIT == g.gameState) {
						// owned games that are not yet set up do not have pilots
						// and need to be added separately to the list to appear
						initGames.add(g)
					}
				}
                   
                def pilotIdList = []
                for(def p in mekUserInstance.pilots) {
                    pilotIdList.add(p.id)
                }
                   
                if(pilotIdList.size() > 0) {
	                def c = Game.createCriteria()
	                gameList = c.listDistinct {
		                or {
			                pilots {
			                  'in'("id", pilotIdList)
			                }
		                }
		                order("updateDate", "desc")
	                }
						
					for(Game g in gameList) {
						switch(g.gameState) {
							case Game.GAME_INIT:
								if(!initGames.contains(g)) initGames.add(g)
								break
								
							case Game.GAME_ACTIVE:
								activeGames.add(g)
								break
							
							case Game.GAME_PAUSED:
								pausedGames.add(g)
								break
								
							case Game.GAME_OVER:
								finishedGames.add(g)
								break
								
							default: break
						}
					}
                }
            %>
                
                <g:if test="${initGames.size() > 0}" >
				<li class="fieldcontain">
					<span id="init-label" class="property-label"><g:message code="games.init.label" default="Planning Stage" /></span>
					
						<g:each in="${initGames}" var="g">
							<g:if test="${g.isInit()}">
								<span class="property-value" aria-labelledby="init-label"><link:stagingGame id="${g.id}">${g.description}</link:stagingGame></span>
							</g:if>
						</g:each>
					
				</li>
				</g:if>
				
				<g:if test="${activeGames.size() > 0}" >
				<li class="fieldcontain">
                    <span id="active-label" class="property-label"><g:message code="games.active.label" default="Active Combat" /></span>
                    
                        <g:each in="${activeGames}" var="g">
                            <g:if test="${g.isActive()}">
                                <span class="property-value" aria-labelledby="active-label"><link:startGame game="${g.id}">${g.description}</link:startGame></span>
                            </g:if>
                        </g:each>
                    
                </li>
                </g:if>
                
                <g:if test="${pausedGames.size() > 0}" >
                <li class="fieldcontain">
                    <span id="paused-label" class="property-label"><g:message code="games.paused.label" default="Cease Fires" /></span>
                    
                        <g:each in="${pausedGames}" var="g">
                            <g:if test="${g.isPaused()}">
                                <span class="property-value" aria-labelledby="paused-label"><link:startGame game="${g.id}">${g.description}</link:startGame></span>
                            </g:if>
                        </g:each>
                    
                </li>
                </g:if>
                
                <g:if test="${finishedGames.size() > 0}" >
                <li class="fieldcontain">
                    <span id="finished-label" class="property-label"><g:message code="games.over.label" default="Debriefings" /></span>
                    
                        <g:each in="${finishedGames}" var="g">
                            <g:if test="${g.isOver()}">
                                <span class="property-value" aria-labelledby="finished-label"><link:debriefGame id="${g.id}">${g.description}</link:debriefGame></span>
                            </g:if>
                        </g:each>
                    
                </li>
				</g:if>
				
			</g:if>
			
			</ul>
		</div>
	</body>
</html>