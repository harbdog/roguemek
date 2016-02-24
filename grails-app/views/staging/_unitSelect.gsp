<%@ 
	page import="roguemek.model.Unit"
 %>

<div id="unit-selection">
	<table>
		<thead>
			<tr>
			
				<g:sortableColumn property="name" title="${message(code: 'unit.name.label', default: 'Name')}" />
				
				<g:sortableColumn property="mass" title="${message(code: 'unit.tonnage.label', default: 'Tonnage')}" />
			
			</tr>
		</thead>
		<tbody>
		
		<g:each in="${unitInstanceList}" status="i" var="thisUnit">
			<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
				
				<td>
					<input type="radio" name="unit-radio" value="${thisUnit.id}" id="${thisUnit.id}">
					<label for="${thisUnit.id}">${thisUnit.toString()}</label>
				</td>
				
				<td>${fieldValue(bean: thisUnit, field: "mass")}</td>
				
			</tr>
		</g:each>
		</tbody>
	</table>
	<div class="pagination">
		<g:paginate total="${unitInstanceTotal ?: 0}" />
	</div>
</div>