package roguemek.assets

import roguemek.model.Terrain

class HexTileset {
	
	String tileset
	Terrain terrain
	Integer elevation
	String image
	
	static constraints = {
		tileset nullable: false
		elevation nullable: false
		terrain nullable: false
		image nullable: false
	}
	
	static void init() {
		File tilesetFile = new File("src/tilesets/roguemek.tileset")
		HexTileset.loadFromFile(tilesetFile)
	}
	
	/**
	 * Sourced from MegaMek HexTileset.java
	 * @param filename
	 * @throws IOException
	 */
	static void loadFromFile(File tilesetFile) throws IOException {
		// make input stream for board
		StreamTokenizer st = new StreamTokenizer(new FileReader(tilesetFile));
		st.eolIsSignificant(true);
		st.commentChar((int)'#');
		st.quoteChar((int)'"');
		st.wordChars((int)'_', (int)'_');
		while (st.nextToken() != StreamTokenizer.TT_EOF) {
			int elevation = 0;
			// int levity = 0;
			String terrain = null;
			String theme = null;
			String imageName = null;
			
			if ((st.ttype == StreamTokenizer.TT_WORD)
					&& (st.sval.equals("base") || st.sval.equals("super") ||
						st.sval.equals("ortho"))) { //$NON-NLS-1$ //$NON-NLS-2$
					
				String tileset = st.sval
				
				/*boolean bas = st.sval.equals("base"); //$NON-NLS-1$
				boolean sup = st.sval.equals("super"); //$NON-NLS-1$
				boolean ort = st.sval.equals("ortho"); //$NON-NLS-1$*/

				if (st.nextToken() == StreamTokenizer.TT_NUMBER) {
					elevation = (int) st.nval;
				} else {
					elevation = Terrain.WILDCARD;
				}
				
				st.nextToken();
				terrain = st.sval;
				
				st.nextToken();
				theme = st.sval;
				
				st.nextToken();
				imageName = st.sval;

				terrain?.tokenize(';').each { tk ->
					log.info(tileset +" "+ elevation +" "+ tk +" "+ theme +" "+ imageName)
					
					Terrain t = Terrain.createTerrain(tk)
					
					if(t != null){
						HexTileset hexTile = new HexTileset(tileset: tileset, terrain: t, elevation: elevation, image: imageName)
						if(!hexTile.validate()) {
							hexTile.errors.allErrors.each {
								log.error(it)
							}
						}
						else {
							hexTile.save flush:true
						}
					}
				}
				if(terrain == null){
					println("*********************** "+tileset +" "+ elevation +" "+ terrain +" "+ theme +" "+ imageName)
				}
				
				/*for (StringTokenizer tk = new StringTokenizer(terrain, ";", false); tk.hasMoreTokens();) {
					Terrain t = Terrain.createTerrain(tk.nextToken())
					
					if(t != null){
						HexTileset hexTile = new HexTileset(tileset: tileset, terrain: t, elevation: elevation, image: imageName)
						if(!hexTile.validate()) {
							hexTile.errors.allErrors.each {
								log.error(it)
							}
						}
						else {
							hexTile.save flush:true
						}
					}
				}*/
				
				// add to list
				/*if (bas) {
					bases.add(new HexEntry(new Hex(elevation, terrain, theme),
							imageName));
				}
				if (sup) {
					supers.add(new HexEntry(new Hex(elevation, terrain, theme),
							imageName));
				}
				if (ort) {
					ortho.add(new HexEntry(new Hex(elevation, terrain, theme),
							imageName));
				}*/
			}
			// else if((st.ttype == StreamTokenizer.TT_WORD) &&
			// st.sval.equals("ortho")){}
		}
	}
}
