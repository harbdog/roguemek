
<div class="nav" role="navigation">
	<ul>
	
		<sec:ifLoggedIn>
			<li><a class="dropship" href="${createLink(uri: '/dropship')}"><g:message code="dropship.home.label" default="Dropship"/></a></li>
		</sec:ifLoggedIn>
		
		<sec:ifAnyGranted roles="ROLE_ADMIN">
	       <li><g:link controller="mekUser"
	                action="index">Users</g:link></li>
	                
	       <li><g:link controller="mekUserRole"
	                action="index">Roles</g:link></li>
	    </sec:ifAnyGranted>
	    
	    <sec:ifAnyGranted roles="ROLE_ROOT">
		   <li><g:link controller="battleMech"
	                action="index">BattleMechs</g:link></li>
	       
	       <li><g:link controller="mech"
	                action="index">Mechs</g:link></li>
	                
	       <li><g:link controller="weapon"
	                action="index">Weapons</g:link></li>
	                
	       <li><g:link controller="game"
	                action="list">Games</g:link></li>
	    </sec:ifAnyGranted>
	    
	    <g:if test="${params.action == 'register'}">
			<%-- Hide login box while registering --%>
		</g:if>
		<g:else>
			<div class="flex right">
				<li><link:userProfile><g:message code="default.profile.label" /></link:userProfile></li>
				<div class="logout">
					<li><g:link controller="logout">Logout</g:link></li>
				</div>
			</div>
		</g:else>
	
	</ul>
    
</div>
