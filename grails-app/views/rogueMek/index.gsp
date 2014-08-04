<html>
	<head>
		<meta http-equiv="Content-type" content="text/html; charset=utf-8">
		<meta name="layout" content="main">
		<title>RogueMek</title>
	</head>
	<body id="body">
		<h1>Prepare for battle!</h1>
		<p>Mechwarrior, are you ready?</p>
	
		<div id="mechPreview" class="previewItem">
			<g:render template="/mech/mechList"
					  model="[mechs: mechPreview]"></g:render>
		</div>
		
		<%-- <div id="userPreview" class="previewItem">
			<g:render template="/user/userList"
					  model="[users: userPreview]"></g:render>
		</div> --%>
		
		<div id="searchBox">
			<h1>Instant Search</h1>
			<g:textField id="searchField" name="searchField" />
			<div id="mechPanel"></div>
		</div>
		
		<r:script>
			$("#searchField").keyup(function() {
				$("#mechPanel").load("${createLink(action: 'search')}?q="+this.value);
			});
		</r:script>
	</body>
</html>