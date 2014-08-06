<ul class="list">
	<g:each in="${mechs?}" var="mechInstance">
		<li class="icon">
			<g:link update="mechPanel"
					controller="mech"
					action="display"
					id="${mechInstance?.id}"
					elementId="mechLink${mechInstance?.id}">${mechInstance?.name}</g:link>
		</li>
	</g:each>
</ul>

<div id="mechPanel"></div>