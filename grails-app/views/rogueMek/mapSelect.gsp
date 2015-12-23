<%@ 
	page import="roguemek.model.HexMap"
 %>
 
<%
 	def maps = []
	def hexMapList = HexMap.list(sort:"name")
%>

<div id="map-selection">
	<g:each in="${hexMapList}" status="i" var="thisMap">
		<div>
			<input type="radio" name="map-radio" value="${thisMap.id}" id="${thisMap.id}">
			<label for="${thisMap.id}">${thisMap.toString()}</label>
		</div>
	</g:each>
</div>