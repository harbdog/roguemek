<div class="player-unit" data-unitid="${unit?.id}">
	<g:if test="${showUnitDelete}">
		<button class="unit-delete" data-unitid="${unit?.id}"></button>
	</g:if>
	
	<div id="unit-image">
 		<g:if test="${unit?.image}">
			<%-- show stored byte array as an image on the page --%>
			<img class="unit-image" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': unit?.id])}"/>
		</g:if>
	</div>
	
	<g:set var="pilot" value="${unit?.pilot}" />
	<span class="unit-name">${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}</span>
</div>