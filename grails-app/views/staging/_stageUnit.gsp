<div class="player-unit" data-unitid="${unit?.id}" data-unit-mass="${unit?.mech?.mass}">
	<div class="player-unit-model" data-model-id="${unit?.mech?.id}">
		<div class="unit-image">
	 		<g:if test="${unit?.image}">
				<%-- show stored byte array as an image on the page --%>
				<%-- time param added to the link to prevent the page from caching the image for when it gets changed through ajax  --%>
				<img class="unit-image" src="${createLink(controller: 'BattleMech', action: 'displayImage', params: ['id': unit?.id, 'time': new Date().getTime()])}"/>
			</g:if>
		</div>
		
		<span class="unit-mass">
			<span>${(int) unit?.mech?.mass}</span>
			<span>Tons</span>
		</span>
		
		<g:set var="pilot" value="${unit?.pilot}" />
		<span class="unit-name">${unit?.encodeAsHTML()} - ${pilot?.encodeAsHTML()}</span>
	</div>
	<g:if test="${showUnitDelete}">
		<button class="unit-delete right" data-unitid="${unit?.id}"></button>
	</g:if>
</div>
