<ul class="list">
	<g:each in="${mechs?}" var="mechInstance">
		<li class="icon">
			<g:link update="mechPanel"
					controller="mech"
					action="display"
					id="${mechInstance?.id}"
					elementId="mechLink${mechInstance?.id}">${mechInstance?.name}</g:link>
		</li>
		
		<asset:script type="text/javascript">
        $('#mechLink${mechInstance.id}').click (function() {
            return showMech(${mechInstance.id});
        });
        </asset:script>
	</g:each>
</ul>

<asset:script type="text/javascript">
function showMech(mechId) {
    $.ajax({
        url: '${createLink(action: "display", controller: "mech")}?id=' + mechId,
        success: function(data) {
            $('#mechPanel').html(data);
            $('#mech' + mechId).fadeIn('slow');
        }
    });
    return false;
}
</asset:script>