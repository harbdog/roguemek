<div id="searchResults" class="searchResults">
	<g:if test="${searchResults}">
		
		<div id="mechResults" class="resultsPane">
			<h2>Mech Search Results</h2>
			<g:render template="/mech/mechList" model="[mechs:searchResults]"></g:render>

		</div>
		
	</g:if>
</div>
