package roguemek.assets

import javax.servlet.ServletContext
import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory

/**
 * Class used to pass along the location of the context root of the application needed for loading resources from the war
 * @author eric
 *
 */
class ContextHelper {
	private static ServletContext servletContext
	
	private static Log log = LogFactory.getLog(this)
	
	/**
	 * Initializes all resource paths that are needed in various locations during runtime
	 * @param srcDir
	 * @param assetsDir
	 */
	public static void setContext(ServletContext context) {
		servletContext = context
	}
	
	/**
	 * Gets all resource paths found under the given path as absolute path strings (either on disk on inside war)
	 * @param path
	 * @return
	 */
	public static Set<String> getResourcePaths(String path) {
		Set<String> paths = servletContext.getResourcePaths(path)

		if(paths == null) {
			// look for the path relatively in the project path instead of the war
			paths = new ArrayList<String>()
			if(path.startsWith("/")) {
				path = path.substring(1)
			}
			
			File diskPath = new File(path)
			diskPath.listFiles().each { file ->
				if(file.isFile() && file.canRead()) {
					paths.add(file.getAbsolutePath())	
				}
			}
		}
		
		return paths
	}
	
	/**
	 * Gets the specified absolute path as input stream (either on disk or inside war)
	 * @param path
	 * @return
	 */
	public static InputStream getResource(String path) {
		URL url = servletContext.getResource(path)
		if(url == null) {
			return new FileInputStream(path)
		}
		else {
			return url.openStream()
		}
	}
	
	/**
	 * Gets the specified location as input stream relative to the "src" folder
	 * @param location
	 * @return
	 */
	public static InputStream getContextSource(String location) {
		URL url = servletContext.getResource("/src/"+location)
		if(url == null) {
			return new FileInputStream("src/"+location)
		}
		else {
			return url.openStream()
		}
	}
	
	/**
	 * Gets the specified location as input stream relative to the "assets" folder
	 * @param location
	 * @return
	 */
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
