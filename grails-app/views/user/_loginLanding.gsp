
<g:if test="${params.action == 'register'}">
	<%-- Hide login box while registering --%>
</g:if>
<g:else>
	<div style="margin-top:20px">
		<div style="float:right;">
			<g:link controller="user" action="profile">Profile</g:link> | <g:link controller="logout">Logout</g:link><br>
		</div>
		
		<%-- You own (${session?.user?.ownedMechs?.size() ?: 0}) Mechs.<br> --%>
		<%--
		<g:each var="mech" in="${session?.user?.ownedMechs?}">
			<span class="mech">${mech.name}</span>
		</g:each>
		 --%>
	</div>
</g:else>

<div id="navPane">
	<g:if test="${params.action == 'register'}">
		<%-- Hide user box while registering --%>
	</g:if>
	<sec:ifLoggedIn>
		<g:link controller="user"
				action="mechs">My Mechs</g:link>
		<br/>
		<g:link controller="mech"
				action="index">List Mechs</g:link>
	</sec:ifLoggedIn>
</div>