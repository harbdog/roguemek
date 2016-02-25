<%@ 
	page import="roguemek.game.BattleUnit"
		 import="roguemek.game.StagingHelper"
 %>

<div class="camo-selection" data-userid="${userInstance?.id}">
	<div id="color-selection">
		<g:set var="userCamo" value="${StagingHelper.getCamoForUser(gameInstance, userInstance)}" />
		
		<g:if test="${userCamo != null && userCamo instanceof Short[]}">
			<g:set var="rgbCamoBackground" value="rgb(${userCamo[0]}, ${userCamo[1]}, ${userCamo[2]})" />
		</g:if>
		<g:else>
			<g:set var="rgbCamoBackground" value="rgb(255, 0, 0)" />
		</g:else>
		
		<div id="color-revert-div">
			<button id="color-revert" value="${rgbCamoBackground}" style="background: ${rgbCamoBackground};"></button>
		</div>
	
		<input id="color-input" value="${rgbCamoBackground}"></input>
	</div>
	
	<div id="camo-preview">
		<g:set var="previewUnit" value="${gameInstance?.getPrimaryUnitForUser(userInstance)}" />
		<g:if test="${previewUnit != null && previewUnit.image != null}">
			<%-- show stored byte array as an image on the page --%>
			<img class="unit-preview" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': previewUnit?.id])}"/>
		</g:if>
	</div>
</div>