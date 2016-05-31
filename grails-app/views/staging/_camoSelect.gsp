<%@ 
	page import="roguemek.game.BattleUnit"
		 import="roguemek.game.StagingHelper"
 %>

<div class="camo-selection" data-userid="${userInstance?.id}">
	<div class="selection-panel">
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
		
		<div id="pattern-selection">
			<div id="pattern-tree">
				<ul>
					<g:each in="${camoPatternPaths}" status="i" var="path">
						<li>${path}</li>
					</g:each>
				</ul>
			</div>
		</div>
	</div>
	
	<div id="camo-preview">
		<g:if test="${previewUnit != null && previewUnit.image != null}">
			<%-- show stored byte array as an image on the page --%>
			<img class="camo-unit-preview" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': previewUnit?.id, 'rgb': rgbCamoBackground])}"/>
		</g:if>
	</div>
</div>
