<ul class="list">
	<g:each in="${users?}" var="userInstance">
        <li class="icon">
            <g:link mapping="userDetails" params='[callsign:"${userInstance?.callsign}"]'>
                <g:img dir="images" file="spinner.gif" />
                ${userInstance?.callsign}
            </g:link>
        </li>
	</g:each>
</ul>