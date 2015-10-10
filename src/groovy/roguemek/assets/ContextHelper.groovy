package roguemek.assets

import javax.servlet.ServletContext

/**
 * Class used to pass along the location of the context root of the application needed for loading resources from the war
 * @author eric
 *
 */
class ContextHelper {
	private static ServletContext servletContext
	
	/**
	 * Initializes all resource paths that are needed in various locations during runtime
	 * @param srcDir
	 * @param assetsDir
	 */
	public static void setContext(ServletContext context) {
		servletContext = context
	}
	
	public static InputStream getContextSource(String location) {
		URL url = servletContext.getResource("/src/"+location)
		if(url == null) {
			return new FileInputStream("src/"+location)
		}
		else {
			return url.openStream()
		}
	}
	
	public static InputStream getContextAsset(String location) {
		URL url = servletContext.getResource("/assets/"+location)
		if(url == null) {
			return new FileInputStream("grails-app/assets/"+location)
		}
		else {
			return url.openStream()
		}
	}
}
