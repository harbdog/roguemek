<%@ 
	page import="roguemek.game.BattleUnit"
		 import="roguemek.game.StagingHelper"
 %>

<div class="camo-selection" data-userid="${userInstance?.id}">
	<div id="selection-panel">
		<g:set var="userCamo" value="${StagingHelper.getCamoForUser(gameInstance, userInstance)}" />
		<g:set var="isPattern" value="${(userCamo instanceof String)}" />
		
		<ul>
			<li><a href="#color-selection">Color</a></li>
			<li><a href="#pattern-selection">Pattern</a></li>
		</ul>
		
		<script type="text/javascript">var camoPatternSelected = ${isPattern};</script>
		<script type="text/javascript">var camoSelectionIndex = ${(isPattern) ? 1 : 0};</script>
		
		<div id="color-selection">
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
					<g:if test="${isPattern}">
						<li data-full-path="${userCamo}" data-jstree='{"type": "file", "opened": true, "selected": true, "icon": "../assets/camo/${userCamo}"}'><a href="#">- Current -</a></li>
					</g:if>
					
					<g:each in="${camoPatternPaths}" status="i" var="path">
						<li data-full-path="${path}">${path}</li>
					</g:each>
				</ul>
			</div>
		</div>
	</div>
	
	<div id="camo-preview">
		<g:if test="${previewUnit != null && previewUnit.image != null}">
			<%-- show stored byte array as an image on the page --%>
			<img class="camo-unit-preview" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': previewUnit?.id, 'time': new Date().getTime()])}"/>
		</g:if>
	</div>
</div>
