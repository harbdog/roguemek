<%@ 
	page import="roguemek.model.HexMap"
 %>

<div id="map-selection">
	<div class="pagination">
		<g:paginate total="${hexMapInstanceTotal ?: 0}" />
	</div>
	<table>
		<thead>
			<tr>
			
				<g:sortableColumn property="name" title="${message(code: 'map.name.label', default: 'Name')}" />
				
				<g:sortableColumn property="size" title="${message(code: 'map.size.label', default: 'Size')}" />
			
			</tr>
		</thead>
		<tbody>
		
		<g:each in="${hexMapInstanceList}" status="i" var="thisMap">
			<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
				
				<td>
					<input type="radio" name="map-radio" value="${thisMap.id}" id="${thisMap.id}">
					<label for="${thisMap.id}">${fieldValue(bean: thisMap, field: "name")}</label>
				</td>
				
				<td>${fieldValue(bean: thisMap, field: "size")}</td>
				
			</tr>
		</g:each>
		</tbody>
	</table>
	<div class="pagination">
		<g:paginate total="${hexMapInstanceTotal ?: 0}" />
	</div>
</div>