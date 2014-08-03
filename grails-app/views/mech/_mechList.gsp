<%@ page import="roguemek.Mech" %>

<ul class="list">
	<%
	   System.out.println "mechs: ${mechs}"
	%>
	<g:each in="${mechs?}" var="mechInstance">
		<li class="icon">
			<g:link mapping="mechDetails" params='[chassis:"${mechInstance?.chassis}", variant:"${mechInstance?.variant}"]'>
				<g:img dir="images" file="spinner.gif" />
				${mechInstance?.name}
			</g:link>
		</li>
	</g:each>
</ul>