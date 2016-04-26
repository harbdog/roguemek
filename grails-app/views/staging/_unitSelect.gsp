<%@ 
	page import="roguemek.model.*"
 %>

<div id="unit-selection">
	<div class="unit-filters">
		<g:form action="unitSelect">
			<g:submitButton name="unit-filter" value="Filter" />
			<g:textField name="name" value="${filters?.name}" size="14" />
			<button class="clear-unit-filter" style="visibility:hidden"></button>
		</g:form>
	</div>

	<div id="unit-selection-panel">
		<div id="unit-selection-table">
			<table>
				<thead>
					<tr>
					
						<g:sortableColumn property="name" title="${message(code: 'unit.name.label', default: 'Name')}" params="${filters}" />
						
						<g:sortableColumn property="mass" title="${message(code: 'unit.tonnage.label', default: 'Tonnage')}" params="${filters}" />
					
					</tr>
				</thead>
				<tbody>
				
				<%
					// if the unitInstanceList is less than 12, make it 12 so the table can be sized consistently
					if(chassisTotal < 12) {
						(chassisTotal+1).upto(12) {
							unitList.add(null)
						}
					}
				%>
				
				<g:set var="prevName" value="${null}" />
				
				<g:each in="${unitList}" status="i" var="thisUnit">
					<tr class="${(i % 2) == 0 ? 'even' : 'odd'}">
						<g:if test="${thisUnit}">
							<g:set var="name" value="${thisUnit.name}"/>
							<g:set var="id" value="${thisUnit.id}"/>
							<g:set var="mass" value="${thisUnit.mass}"/>
							<g:set var="chassis" value="${thisUnit.chassis}"/>
							<g:set var="variant" value="${thisUnit.variant}"/>
							
							<g:if test="${prevName != name}">
								<td>
									<input type="radio" name="unit-chassis-radio" value="${id}" id="${id}"
											data-unit-name="${name}" data-unit-chassis="${chassis}" data-unit-variant="${variant}">
									<label for="${id}">${name}</label>
								</td>
								
								<td>${(int) mass}</td>
								
								<g:set var="prevName" value="${name}"/>
							</g:if>
							<g:else>
								<td class="hidden">
									<%-- Any variants beyond first for chassis will be hidden 
										 until it can be shown dynamically when selected --%>
									<input type="radio" name="unit-chassis-radio" value="${id}"
											data-unit-name="${name}" data-unit-chassis="${chassis}" data-unit-variant="${variant}">
								</td>
								<td class="hidden"></td>
							</g:else>
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
		
		<div id="unit-preview-panel">
			<div id="unit-selection-preview">
				<%-- unit previews will load here using ajax --%>
			</div>
			<div id="unit-selection-variant" class="clear">
				<%-- variant selection will load here dyamically --%>
			</div>
		</div>
	</div>
	
	<div class="pagination">
		<g:paginate total="${unitTotal ?: 0}" params="${filters}" />
	</div>
</div>
