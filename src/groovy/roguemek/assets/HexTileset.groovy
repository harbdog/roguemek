package roguemek.assets

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

import roguemek.model.Terrain

class HexTileset {
	private static Log log = LogFactory.getLog(this)
	
	private static ArrayList<HexEntry> bases = new ArrayList<HexEntry>()
    private static ArrayList<HexEntry> supers = new ArrayList<HexEntry>()
    private static ArrayList<HexEntry> ortho = new ArrayList<HexEntry>()
	
	/**
	 * Initialize the tileset for Hex images
	 */
	public static void init() {
		File tilesetFile = new File("src/tilesets/roguemek.tileset")
		HexTileset.loadFromFile(tilesetFile)
	}
	
	/**
	 * Sourced from MegaMek HexTileset.java
	 * @param filename
	 * @throws IOException
	 */
	private static void loadFromFile(File tilesetFile) throws IOException {
		// make input stream for board
		StreamTokenizer st = new StreamTokenizer(new FileReader(tilesetFile))
		st.eolIsSignificant(true)
		st.commentChar((int)'#')
		st.quoteChar((int)'"')
		st.wordChars((int)'_', (int)'_')
		while (st.nextToken() != StreamTokenizer.TT_EOF) {
			
			int elevation = 0
			String terrain = null
			String theme = null
			String imageName = null
			
			if ((st.ttype == StreamTokenizer.TT_WORD)
					&& (st.sval.equals("base") || st.sval.equals("super") || st.sval.equals("ortho"))) {
					
				String tileset = st.sval
				
				boolean bas = st.sval.equals("base")
				boolean sup = st.sval.equals("super")
				boolean ort = st.sval.equals("ortho")

				if (st.nextToken() == StreamTokenizer.TT_NUMBER) {
					elevation = (int) st.nval
				} else {
					elevation = Terrain.WILDCARD
				}
				
				st.nextToken()
				terrain = st.sval
				
				st.nextToken()
				theme = st.sval
				
				st.nextToken()
				imageName = st.sval
				
				// add to lists
				if (bas) {
					bases.add(new HexEntry(new IHex(elevation, terrain, theme), imageName))
				}
				if (sup) {
					supers.add(new HexEntry(new IHex(elevation, terrain, theme), imageName))
				}
				if (ort) {
					ortho.add(new HexEntry(new IHex(elevation, terrain, theme), imageName))
				}
			}
		}
	}
}

/**
 * Unlike the MegaMek sourced IHex, this will only be used to determine image names
 * for Hex to serve as the temporary copy of Hex
 */
class IHex {
	private int elevation
	private HashSet terrains
	private String theme
	
	public IHex(int elevation, String terrain, String theme) {
		this.elevation = elevation
		this.theme = theme
		
		terrains = new HashSet()
		terrain?.tokenize(';').each { tk ->
			terrains.add(Terrain.createTerrain(tk))
		}
	}
}

/**
 * Sourced from MegaMek HexTileset.java
 */
class HexEntry {
	private IHex hex
	private String image
	private Vector<String> filenames
	
	public HexEntry(IHex hex, String imageFiles) {
		this.hex = hex
		
		filenames = new Vector<String>()
		imageFiles?.tokenize(';').each { tk ->
			filenames.add(tk)
		}
	}

	public IHex getHex() {
		return hex
	}
}
