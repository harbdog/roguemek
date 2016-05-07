<%@ page 
	import="roguemek.MekUser"
	import="roguemek.game.BattleUnit"
	import="roguemek.game.BattleMech"
%>

<%
    // calculate team totals
    int totalUnits = 0
    int totalTonnage = 0
    teamStagingUsers?.each { teamStagingUser ->
        totalUnits += teamStagingUser.units?.size() ?: 0
        teamStagingUser.units?.each { BattleUnit unit ->
            if(unit instanceof BattleMech) {
                totalTonnage += unit.mech.mass
            }
        }
    }
%>

<div class="team" data-teamnum="${(teamNum >= 0) ? teamNum : teamStagingUsers?.first()?.user?.id}">
    <div class="team-header">
        <g:if test="${(teamNum >= 0)}">
            <h2>Team ${teamNum}</h2>
        </g:if>
        <span class="team-unit-count">${totalUnits} Units</span>
        <span class="team-tonnage-count right">${totalTonnage} Tons</span>
    </div>

    <g:each in="${teamStagingUsers}" var="teamStagingUser">
        <g:set var="teamUser" value="${teamStagingUser.user}" />
        
        <g:render template="stageUser" model="[gameInstance: gameInstance, userInstance: userInstance, user: teamUser]" />
        
    </g:each>
</div>
