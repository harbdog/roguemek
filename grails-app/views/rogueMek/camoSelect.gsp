<%@ 
	page import="roguemek.game.BattleUnit"
		 import="roguemek.game.StagingHelper"
 %>

<div class="camo-selection" id="${userInstance?.id}">
	<div id="color-selection">
		<g:set var="userCamo" value="${StagingHelper.getCamoForUser(gameInstance, userInstance)}" />
		
		<g:if test="${userCamo != null && userCamo instanceof Short[]}">
			<g:set var="rgbCamoBackground" value="rgb(${userCamo[0]}, ${userCamo[1]}, ${userCamo[2]})" />
		</g:if>
		<g:else>
			<g:set var="rgbCamoBackground" value="rgb(155, 155, 155)" />
		</g:else>
		
		<div id="color-revert-div">
			<button id="color-revert" value="${rgbCamoBackground}" style="background: ${rgbCamoBackground};"></button>
		</div>
	
		<input id="color-input" value="${rgbCamoBackground}"></input>
	</div>
	
	<div id="camo-preview">
	</div>
</div>