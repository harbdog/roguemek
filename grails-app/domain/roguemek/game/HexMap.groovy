package roguemek.game

class HexMap {

	Integer numCols
	Integer numRows
	
	byte[] hexMap
	
    static constraints = {
		numRows min: 0
		numCols min: 0
		
		// setting map as bytes with a large maxSize
		// where by default H2 was creating as 255 bytes
		hexMap maxSize: 2048
    }
	
	public static HexMap loadBoardFile(File boardFile) {
		def numCols = 0
		def numRows = 0
		
		byte[] hexMap
		
		try {
			FileInputStream fs = new FileInputStream(boardFile)
			StreamTokenizer st = new StreamTokenizer(fs)
			st.eolIsSignificant(true);
			st.commentChar((int)'#');
			st.quoteChar((int)'"');
			st.wordChars((int)'_', (int)'_');
			
			int x_pos = 1;
			int y_pos = 1;
			
			while (st.nextToken() != StreamTokenizer.TT_EOF) {
				if ((st.ttype == StreamTokenizer.TT_WORD)
						&& st.sval.equalsIgnoreCase("size")) {
					// read rest of line
					String[] args = [ "0", "0" ];
					int i = 0;
					while ((st.nextToken() == StreamTokenizer.TT_WORD)
							|| (st.ttype == '"')
							|| (st.ttype == StreamTokenizer.TT_NUMBER)) {
						args[i++] = st.ttype == StreamTokenizer.TT_NUMBER ? (int) st.nval + "" : st.sval;
					}
					numCols = Integer.parseInt(args[0]);
					numRows = Integer.parseInt(args[1]);
					
					hexMap = new byte[numCols*numRows]
					
				} else if ((st.ttype == StreamTokenizer.TT_WORD)
						&& st.sval.equalsIgnoreCase("option")) {
					// TODO: read rest of line
					/*String[] args = [ "", "" ];
					int i = 0;
					while ((st.nextToken() == StreamTokenizer.TT_WORD)
							|| (st.ttype == '"')
							|| (st.ttype == StreamTokenizer.TT_NUMBER)) {
						args[i++] = st.ttype == StreamTokenizer.TT_NUMBER ? (int) st.nval + "" : st.sval;
					}
					// Only expect certain options.
					if (args[0].equalsIgnoreCase("exit_roads_to_pavement")) {
						if (args[1].equalsIgnoreCase("false")) {
							roadsAutoExit = false;
						} else {
							roadsAutoExit = true;
						}
					}*/ // End exit_roads_to_pavement-option
						
				} else if ((st.ttype == StreamTokenizer.TT_WORD)
						&& st.sval.equalsIgnoreCase("hex")) {
					// read rest of line
					String[] args = [ "", "0", "", "" ];
					int i = 0;
					while ((st.nextToken() == StreamTokenizer.TT_WORD)
							|| (st.ttype == '"')
							|| (st.ttype == StreamTokenizer.TT_NUMBER)) {
							
						args[i++] = st.ttype == StreamTokenizer.TT_NUMBER ? (int) st.nval + "" : st.sval;
					}
							
					String hexCoords = args[0]
					int elevation = Integer.parseInt(args[1])
					String terrains = args[2]
					String theme = args[3]
					
					int newIndex = indexFor(args[0], numCols, y_pos);
					Hex hex = Hex.createHex(hexCoords, elevation, terrains, theme)
					hexMap[newIndex] = hex?.id
					//nd[newIndex] = new Hex(elevation, args[2], args[3], new Coords(x_pos-1,y_pos-1));
					
					x_pos++;
					if (x_pos > numCols) {
						y_pos++;
						x_pos = 1;
					}
					
				} else if ((st.ttype == StreamTokenizer.TT_WORD)
						&& st.sval.equalsIgnoreCase("end")) {
					break;
				}
			}
		} catch (IOException ex) {
			System.err.println("i/o error reading board");
			System.err.println(ex);
		}
	
		// TODO: fill nulls with blank hexes
		/*for (int i = 0; i < nd.length; i++) {
			if (nd[i] == null) {
				nd[i] = new Hex();
			}
		}*/
		
		if(numCols > 0 && numRows > 0) {
			HexMap board = new HexMap(numCols: numCols, numRows: numRows, hexMap: hexMap)
			if(!board.validate()) {
				board.errors.allErrors.each {
					log.error(it)
				}
				return null
			}
			else {
				board.save flush:true
				return board
			}
		}
		
		return null
	}
	
	private static int indexFor(String hexNum, int width, int row) {
		int substringDiff = 2;
		if (row > 99) {
			substringDiff = Integer.toString(width).length();
		}
		int x = Integer.parseInt(hexNum.substring(0, hexNum.length()
				- substringDiff)) - 1;
		int y = Integer.parseInt(hexNum.substring(hexNum.length()
				- substringDiff)) - 1;
		return (y * width) + x;
	}
}
