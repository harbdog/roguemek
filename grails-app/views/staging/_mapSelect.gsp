<%@ 
	page import="roguemek.model.HexMap"
 %>

<div id="map-selection">
	<div class="pagination">
		<g:paginate total="${hexMapInstanceTotal ?: 0}" />
	</div>
	
	<div id="map-selection-panel">
		<div id="map-selection-table">
			<table>
				<thead>
					<tr>
					
						<g:sortableColumn property="name" title="${message(code: 'map.name.label', default: 'Name')}" />
						
						<g:sortableColumn property="size" title="${message(code: 'map.size.label', default: 'Size')}" />
					
					</tr>
				</thead>
				<tbody>
				
				<%
					// if the hexMapInstanceList is less than 15, make it 15 so the table can be sized consistently
					def numMaps = hexMapInstanceList.size() 
					if(numMaps < 15) {
						(numMaps+1).upto(15) {
							hexMapInstanceList.add(null)
						}
					}
				%>
				
				<g:each in="${hexMapInstanceList}" status="i" var="thisMap">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
						
						<g:if test="${thisMap}">
							<td>
								<input type="radio" name="map-radio" value="${thisMap.id}" id="${thisMap.id}">
								<label for="${thisMap.id}">${fieldValue(bean: thisMap, field: "name")}</label>
							</td>
							
							<td>${fieldValue(bean: thisMap, field: "size")}</td>
						</g:if>
						<g:else>
							<%-- Filling up space so the dialog looks good --%>
							<td>&nbsp;</td><td>&nbsp;</td>
						</g:else>
					</tr>
				</g:each>
				</tbody>
			</table>
		</div>
	
		<div id="map-selection-preview">
			<%-- map previews will load here using ajax --%>
		</div>
	</div>
	
	<div class="pagination">
		<g:paginate total="${hexMapInstanceTotal ?: 0}" />
	</div>
</div>