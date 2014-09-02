<%@ page import="roguemek.game.Game" %>



<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'gameState', 'error')} required">
	<label for="gameState">
		<g:message code="game.gameState.label" default="Game State" />
		<span class="required-indicator">*</span>
	</label>
	
	<g:radio name="gameState" value="${Game.GAME_ACTIVE}" checked="${gameInstance?.gameState == Game.GAME_ACTIVE}"/>Active
	<g:radio name="gameState" value="${Game.GAME_PAUSED}" checked="${gameInstance?.gameState == Game.GAME_PAUSED}"/>Paused
	<g:radio name="gameState" value="${Game.GAME_OVER}" checked="${gameInstance?.gameState == Game.GAME_OVER}"/>Game Over

</div>

<div class="fieldcontain ${hasErrors(bean: gameInstance, field: 'pilots', 'error')} ">
	<label for="pilots">
		<g:message code="game.pilots.label" default="Pilots" />
		
	</label>
	<g:select name="pilots" from="${roguemek.game.Pilot.list()}" multiple="multiple" optionKey="id" size="5" value="${gameInstance?.pilots*.id}" class="many-to-many"/>

</div>
