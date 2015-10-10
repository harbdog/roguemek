package roguemek.assets

/**
 * Class used to pass along the location of the context root of the application needed for loading resources from the war
 * @author eric
 *
 */
class ContextHelper {
	private static File CONTEXT_SRC_DIR
	private static File CONTEXT_ASSETS_DIR
	
	/**
	 * Initializes all resource paths that are needed in various locations during runtime
	 * @param srcDir
	 * @param assetsDir
	 */
	public static void initializeContextDirs(File srcDir, File assetsDir) {
		CONTEXT_SRC_DIR = srcDir
		CONTEXT_ASSETS_DIR = assetsDir
	}
	
	public static File getContextSourceDir() {
		return CONTEXT_SRC_DIR
	}
	
	public static File getContextAssetsDir() {
		return CONTEXT_ASSETS_DIR
	}
}
