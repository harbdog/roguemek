<%@ page
	import="roguemek.model.HexMap" 
 %>

<div id="map-image-preview">
	<span>${map}</span>

	<g:set var="boardPath" value="boards/${map?.name}.png" />
	<asset:assetPathExists src="${boardPath}">
		<asset:image src="${boardPath}" height="500px" title="${map}" />
	</asset:assetPathExists>
</div>
