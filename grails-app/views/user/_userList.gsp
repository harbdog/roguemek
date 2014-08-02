<ul class="list">
	<g:each in="${users?}" var="user">
        <li class="icon">
            <g:link controller="store" action="shop">
                <g:img dir="images" file="spinner.gif" />
                ${user?.callsign}
            </g:link>
        </li>
	</g:each>
</ul>