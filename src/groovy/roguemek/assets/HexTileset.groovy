package roguemek.assets

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

import roguemek.game.Hex
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
		File tilesetFile = new File("src/tilesets/atmospheric.tileset")
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
			
			if ((st.ttype == StreamTokenizer.TT_WORD) && 
					(st.sval.equals("base") || st.sval.equals("super") || st.sval.equals("ortho"))) {
					
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
	
	/**
	 * Returns the ordered image names used for a given hex based on its terrains
	 * @param hex
	 * @return
	 */
	public static String[] getImageArray(Hex hex) {
		IHex hexCopy = new IHex(hex)
		
		ArrayList images = new ArrayList<String>()
		
		String base = baseFor(hexCopy)
		images.add(base)
		
		if(hexCopy.terrainsPresent() > 0) {
			// only look for supers/ortho if there is at least one terrain to find
			List<String> supers = supersFor(hexCopy)
			images.addAll(supers)
			
			List<String> ortho = orthoFor(hexCopy)
			images.addAll(ortho)
		}
		
		return images.toArray()
	}
	
	/**
	 * Returns a list of orthographic images to be tiled above the hex. As noted
	 * above, all matches must be 1.0, and if such a match is achieved, all
	 * terrain elements from the tileset hex are removed from the hex. Thus you
	 * want to pass a copy of the original to this function.
	 * Sourced from MegaMek HexTileset.java
	 */
	private static List<String> orthoFor(IHex hex) {
		ArrayList<String> matches = new ArrayList<String>()

		// find orthographic image matches
		for (Iterator<HexEntry> i = ortho.iterator(); i.hasNext();) {
			HexEntry entry = i.next()
			if (orthoMatch(hex, entry.getHex()) >= 1.0) {
				matches.add(entry.getImage())
				// remove involved terrain from consideration
				int[] terrTypes = entry.getHex().getTerrainTypes()
				for (int j = 0; j < terrTypes.length; j++) {
					if (entry.getHex().containsTerrain(terrTypes[j])) {
						hex.removeTerrain(terrTypes[j])
					}
				}
			}
		}
		
		//log.info("*** orthoFor "+hex)
		//log.info("    :"+matches)
		
		return matches;
	}

	/**
	 * Returns a list of images to be superimposed on the hex. As noted above,
	 * all matches must be 1.0, and if such a match is achieved, all terrain
	 * elements from the tileset hex are removed from the hex. Thus you want to
	 * pass a copy of the original to this function.
	 * Sourced from MegaMek HexTileset.java
	 */
	private static List<String> supersFor(IHex hex) {
		ArrayList<String> matches = new ArrayList<String>();

		// find superimposed image matches
		for (Iterator<HexEntry> i = supers.iterator(); i.hasNext();) {
			HexEntry entry = i.next()
			
			if (superMatch(hex, entry.getHex()) >= 1.0) {
				
				matches.add(entry.getImage())
				// remove involved terrain from consideration
				int[] terrTypes = entry.getHex().getTerrainTypes()
				for (int j = 0; j < terrTypes.length; j++) {
					if (entry.getHex().containsTerrain(terrTypes[j])) {
						hex.removeTerrain(terrTypes[j])
					}
				}
			}
		}
		
		//log.info("*** supersFor "+hex)
		//log.info("    :"+matches)
		
		return matches;
	}

	/**
	 * Returns the best matching base image for this hex. This works best if any
	 * terrain with a "super" image is removed.
	 * Sourced from MegaMek HexTileset.java
	 */
	private static String baseFor(IHex hex) {
		HexEntry bestMatch = null
		double match = -1

		// match a base image to the hex
		Iterator<HexEntry> iter = bases.iterator()

		while (iter.hasNext()) {
			HexEntry entry = iter.next()

			// Metal deposits don't count for visual
			if (entry.getHex().containsTerrain(Terrain.METAL_CONTENT)) {
				hex.removeTerrain(Terrain.METAL_CONTENT)
			}
			
			double thisMatch = baseMatch(hex, entry.getHex())
			
			// stop if perfect match
			if (thisMatch == 1.0) {
				bestMatch = entry
				break
			}
			// compare match with best
			if (thisMatch > match) {
				bestMatch = entry
				match = thisMatch
			}
		}
		
		if(match == 0 && hex.terrainsPresent() > 0) {
			// When no Base matches were found then it means the terrains
			// were all super/ortho so try without any terrains
			IHex hexNoTerrains = new IHex(hex.getElevation(), "", hex.getTheme())
			
			return baseFor(hexNoTerrains)
		}
		
		//log.info("*** baseFor "+hex)
		//log.info("    :"+bestMatch.getImage())
		
		return bestMatch.getImage()
	}
	
	/**
	 * Match the two hexes using the "ortho" super* formula. All matches must be
	 * exact, however the match only depends on the original hex matching all
	 * the elements of the comparison, not vice versa.
	 * <p/>Sourced from MegaMek HexTileset.java
	 * EXCEPTION: a themed original matches any unthemed comparison.
	 */
	private static double orthoMatch(IHex org, IHex com) {
		// check elevation
		if ((com.getElevation() != Terrain.WILDCARD)
				&& (org.getElevation() != com.getElevation())) {
			return 0
		}
		
		// A themed original matches any unthemed comparison.
		if ((com.getTheme() != null) && !com.getTheme().equalsIgnoreCase(org.getTheme())) {
			return 0.0
		}
		
		// org terrains must match com terrains
		if (org.terrainsPresent() < com.terrainsPresent()) {
			return 0.0
		}
		
		// check terrain
		int[] cTerrainTypes = com.getTerrainTypes()
		for (int i = 0; i < cTerrainTypes.length; i++) {
			int cTerrType = cTerrainTypes[i]
			Terrain cTerr = com.getTerrain(cTerrType)
			Terrain oTerr = org.getTerrain(cTerrType)
			
			if (cTerr == null) {
				continue
			} else if ((oTerr == null) || 
					((cTerr.getLevel() != Terrain.WILDCARD) && (oTerr.getLevel() != cTerr.getLevel())) || 
					(cTerr.hasExitsSpecified() && (oTerr.getExits() != cTerr.getExits()))) {
				return 0
			}
		}

		return 1.0
	}

	/**
	 * Match the two hexes using the "super" formula. All matches must be exact,
	 * however the match only depends on the original hex matching all the
	 * elements of the comparision, not vice versa.
	 * <p/>Sourced from MegaMek HexTileset.java
	 * EXCEPTION: a themed original matches any unthemed comparason.
	 */
	private static double superMatch(IHex org, IHex com) {
		//log.info("superMatch "+org+" vs. "+com)
		
		// check elevation
		if ((com.getElevation() != Terrain.WILDCARD) && (org.getElevation() != com.getElevation())) {
			//log.info("   NOT MATCHED: Elevation")
			return 0
		}
		
		// A themed original matches any unthemed comparison.
		if ((com.getTheme() != null) && !com.getTheme().equalsIgnoreCase(org.getTheme())) {
			//log.info("   NOT MATCHED: Theme")
			return 0.0
		}
		
		// org terrains must match com terrains
		if (org.terrainsPresent() < com.terrainsPresent()) {
			//log.info("   NOT MATCHED: Terrains Present")
			return 0.0
		}
	   
		// check terrain
		int[] cTerrainTypes = com.getTerrainTypes();
		for (int i = 0; i < cTerrainTypes.length; i++) {
			int cTerrType = cTerrainTypes[i];
			Terrain cTerr = com.getTerrain(cTerrType);
			Terrain oTerr = org.getTerrain(cTerrType);
			if (cTerr == null) {
				continue
			} else if ((oTerr == null) ||
					((cTerr.getLevel() != Terrain.WILDCARD) && (oTerr.getLevel() != cTerr.getLevel())) ||
					(cTerr.hasExitsSpecified() && (oTerr.getExits() != cTerr.getExits()))) {
				//log.info("   NOT MATCHED: Level/Exits")
				return 0
			}
		}

		//log.info("   MATCHED!!!")
		
		return 1.0
	}
	
	/**
	 * Match the two hexes using the "base" formula.
	 * <p/>Sourced from MegaMek HexTileset.java
	 * Returns a value indicating how close of a match the original hex is to
	 * the comparison hex. 0 means no match, 1 means perfect match.
	 */
	private static double baseMatch(IHex org, IHex com) {
		double elevation
		double terrain
		double theme
		
		//log.info("baseMatch "+org+" vs. "+com)

		// check elevation
		if (com.getElevation() == Terrain.WILDCARD) {
			elevation = 1.0
		} else {
			elevation = 1.01 / (Math.abs(org.getElevation() - com.getElevation()) + 1.01)
		}

		// Determine maximum number of terrain matches.
		double maxTerrains = Math.max(org.terrainsPresent(), com.terrainsPresent())
		double matches = com.terrainsPresent() == 0 ? 0.0001 : 0
		
		int[] orgTerrains = org.getTerrainTypes()
		
		for (int i = 0; i < orgTerrains.length; i++){
			int terrType = orgTerrains[i]
			Terrain cTerr = com.getTerrain(terrType)
			Terrain oTerr = org.getTerrain(terrType)
			if ((cTerr == null) || (oTerr == null)) {
				continue
			}
			
			double thisMatch = 0

			if (cTerr.getLevel() == Terrain.WILDCARD) {
				thisMatch = 1.0
			} else {
				thisMatch = 1.0 / (Math.abs(oTerr.getLevel() - cTerr.getLevel()) + 1.0)
			}
			// without exit match, terrain counts... um, half?
			if (cTerr.hasExitsSpecified() && (oTerr.getExits() != cTerr.getExits())) {
				thisMatch *= 0.5
			}
			// add up match value
			matches += thisMatch
		}
		if (maxTerrains == 0) {
			terrain = 1.0
		} 
		else {
			terrain = matches / maxTerrains
		}

		// check theme
		if ((com.getTheme() == org.getTheme()) || 
				((com.getTheme() != null) && com.getTheme().equalsIgnoreCase(org.getTheme()))) {
			theme = 1.0
		} else {
			// also don't throw a match entirely out because the theme is off
			theme = 0.0001
		}
		
		// TODO: Terrain of ["rough:1;mud:1" "mars"] shows mud image as base in MegaMek (instead of mars rough image), but how can it since the theme not matching gets it set to 0.0001?
		//log.info("    "+(elevation * terrain * theme)+"="+elevation+" * "+terrain+" * "+theme)
		
		return elevation * terrain * theme
	}
}

/**
 * Unlike the MegaMek sourced IHex, this will only be used to determine image names
 * for Hex and to serve as the temporary copy of Hex
 */
class IHex {
	private int elevation
	private HashSet<Terrain> terrains
	private String theme
	
	public IHex(int elevation, String terrain, String theme) {
		this.elevation = elevation
		this.theme = (theme == null || theme.length() > 0) ? theme : null
			
		terrains = new HashSet()
		terrain.tokenize(';').each { tk ->
			terrains.add(Terrain.createTerrain(tk))
		}
	}
	
	public IHex(Hex hex) {
		if(hex != null) {
			this.elevation = hex.elevation
			this.terrains = hex.terrains?.clone()
			this.theme = (hex.theme == null || hex.theme.length() > 0) ? hex.theme : null
		}
	}
	
	public boolean containsTerrain(int type) {
		return this.getTerrain(type) != null
	}
	
	public Terrain getTerrain(int terrainType) {
		Terrain foundTerrain = null
		
		this.terrains.each { t ->
			if(t.type == terrainType) {
				foundTerrain = t
				return 
			}
		}
		
		return foundTerrain
	}
	
	public void removeTerrain(int terrainType) {
		HashSet<Terrain> removals = new HashSet()
		
		this.terrains.each { t ->
			if(t.type == terrainType) {
				removals.add(t)
			}
		}
		
		removals.each { t ->
			this.terrains?.remove(t)
		}
	}
	
	public int[] getTerrainTypes() {
		ArrayList types = new ArrayList()
		
		this.terrains.each { t ->
			types.add(t.type)
		}
		
		return types.toArray()
	}
	
	public int terrainsPresent() {
		return terrains.size();
	}
	
	public int getElevation() {
		return this.elevation
	}
	
	public String getTheme() {
		return this.theme
	}
	
	@Override
	public String toString() {
		return "<IHex: ^"+elevation+" "+theme+" ***"+terrains.toString()+">"
	}
}

/**
 * Sourced from MegaMek HexTileset.java
 */
class HexEntry {
	private IHex hex
	private Vector<String> filenames
	
	public HexEntry(IHex hex, String imageFiles) {
		this.hex = hex
		
		filenames = new Vector<String>()
		imageFiles.tokenize(';').each { tk ->
			filenames.add(tk)
		}
	}
	
	public IHex getHex() {
		return this.hex
	}
	
	public String getImage() {
		return this.filenames.firstElement()
	}
	
	@Override
	public String toString() {
		return "{HexEntry: "+hex.toString()+" >>>"+filenames.toString()+"}"
	}
}
