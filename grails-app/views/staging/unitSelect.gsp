<%@ 
	page import="roguemek.model.Unit"
 %>
 
<%
	def unitList = Unit.list(sort:"name")
%>

<div id="unit-selection">
	<g:each in="${unitList}" status="i" var="thisUnit">
		<div>
			<input type="radio" name="unit-radio" value="${thisUnit.id}" id="${thisUnit.id}">
			<label for="${thisUnit.id}">${thisUnit.toString()}</label>
		</div>
	</g:each>
</div>