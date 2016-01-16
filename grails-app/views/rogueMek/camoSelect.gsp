<%@ 
	page import="roguemek.game.BattleUnit"
 %>

<div id="camo-selection">
	<div id="color-selection">
		<g:set var="userCamo" value="${gameInstance?.getCamoForUser(userInstance)}" />
		
		<g:if test="${userCamo != null && userCamo instanceof Short[]}">
			<g:set var="rgbCamoBackground" value="rgb(${userCamo[0]}, ${userCamo[1]}, ${userCamo[2]})" />
		</g:if>
		<g:else>
			<g:set var="rgbCamoBackground" value="rgb(255, 255, 255)" />
		</g:else>
	
		<input id="color-input" value="${rgbCamoBackground}"></input>
	</div>
</div>