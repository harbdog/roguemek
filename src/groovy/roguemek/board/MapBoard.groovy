package roguemek.board

import java.io.InputStream;

import org.apache.commons.logging.LogFactory
import org.apache.commons.logging.Log

import roguemek.assets.ContextHelper
import roguemek.model.HexMap
import roguemek.model.Hex

class MapBoard {
	private static Log log = LogFactory.getLog(this)
	
	private static final String BOARD_ROOT_PATH = "/src/boards/"
	private static final String BOARD_EXTENSION = ".board"
	
	public static void initBoards() {
		Set<String> boardPaths = ContextHelper.getResourcePaths(BOARD_ROOT_PATH)
		
		for(String path in boardPaths) {
			MapBoard.initBoardFromPath(path)
		}
	}
	
	public static HexMap initBoardFromPath(String path) {
		// check to see if the board is already loaded into the database
		HexMap board = HexMap.findByPath(path)
		if(board != null) {
			log.info("Board already loaded: "+path)
			return board
		}
		
		InputStream boardFile = ContextHelper.getResource(path)
		if(boardFile.available() && path.endsWith(BOARD_EXTENSION)) {
			// load only the board names and sizes to begin with, the contents of each map
			// will be loaded as it is used the first time
			def boardSize = getBoardSize(boardFile)
			def numCols = boardSize.numCols
			def numRows = boardSize.numRows
			
			if(numCols == 0 || numRows == 0) {
				log.error("Board file has zero columns and/or rows: "+path)
				return board
			}
			
			// generate the name by stripping the parent path, extension, and capitalizing the first letters
			def pathSeparator = File.separator
			if(path.contains("/")) {
				// URIs inside a war only use /
				pathSeparator = "/"
			}
			
			def boardFileName = path.substring(path.lastIndexOf(pathSeparator)+1)
			def boardName = boardFileName.substring(0, boardFileName.lastIndexOf(BOARD_EXTENSION))
					.replaceAll('_', ' ').split(' ')
					.collect{ it.capitalize() }.iterator().join(' ')
			
			board = new HexMap(name: boardName, path: path, numCols: numCols, numRows: numRows)
			
			if(!board.validate()) {
				board.errors.allErrors.each {
					log.error(it)
				}
				return null
			}
			else {
				board.save flush:true
			}
		}
		else {
			log.error("File unavailable or is not a "+BOARD_EXTENSION+" file: "+path)
		}
		
		return board
	}
	
	/**
	 * Reads the given board file until it finds the number of rows and colums
	 * @param boardStream
	 * @return def map (numCols: x, numRows: y)
	 */
	public static def getBoardSize(InputStream boardStream) {
		def numCols = 0
		def numRows = 0
		
		try {
			StreamTokenizer st = new StreamTokenizer(new InputStreamReader(boardStream))
			st.eolIsSignificant(true)
			st.commentChar((int)'#')
			st.quoteChar((int)'"')
			st.wordChars((int)'_', (int)'_')
			
			int x_pos = 1
			int y_pos = 1
			
			while (st.nextToken() != StreamTokenizer.TT_EOF) {
				if ((st.ttype == StreamTokenizer.TT_WORD) && st.sval.equalsIgnoreCase("size")) {
					// read rest of line
					String[] args = [ "0", "0" ]
					
					int i = 0
					while ((st.nextToken() == StreamTokenizer.TT_WORD)
							|| (st.ttype == '"')
							|| (st.ttype == StreamTokenizer.TT_NUMBER)) {
						args[i++] = st.ttype == StreamTokenizer.TT_NUMBER ? (int) st.nval + "" : st.sval
					}
					numCols = Integer.parseInt(args[0])
					numRows = Integer.parseInt(args[1])
					
					break;
				}
			}
		} catch (IOException ex) {
			log.error("i/o error reading board")
			log.error(ex)
		} finally {
			if(boardStream != null) {
				boardStream.close()
			}
		}
		
		return [numCols: numCols, numRows: numRows]
	}
	
	/**
	 * Loads the board file into the HexMap object
	 * @param boardName
	 * @param boardFile
	 * @return
	 */
	public static def loadBoard(HexMap board) {
		if(board.mapLoaded) return null
		
		InputStream boardStream = ContextHelper.getResource(board.path)
		
		def numCols = 0
		def numRows = 0
		
		String[] hexMap
		
		try {
			StreamTokenizer st = new StreamTokenizer(new InputStreamReader(boardStream))
			st.eolIsSignificant(true)
			st.commentChar((int)'#')
			st.quoteChar((int)'"')
			st.wordChars((int)'_', (int)'_')
			
			int x_pos = 1
			int y_pos = 1
			
			while (st.nextToken() != StreamTokenizer.TT_EOF) {
				if ((st.ttype == StreamTokenizer.TT_WORD) && st.sval.equalsIgnoreCase("size")) {
					// read rest of line
					String[] args = [ "0", "0" ]
					
					int i = 0
					while ((st.nextToken() == StreamTokenizer.TT_WORD)
							|| (st.ttype == '"')
							|| (st.ttype == StreamTokenizer.TT_NUMBER)) {
						args[i++] = st.ttype == StreamTokenizer.TT_NUMBER ? (int) st.nval + "" : st.sval
					}
					numCols = Integer.parseInt(args[0])
					numRows = Integer.parseInt(args[1])
					
					hexMap = new String[numCols*numRows]
					
				} else if ((st.ttype == StreamTokenizer.TT_WORD) && st.sval.equalsIgnoreCase("option")) {
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
						
				} else if ((st.ttype == StreamTokenizer.TT_WORD) && st.sval.equalsIgnoreCase("hex")) {
					// read rest of line
					String[] args = [ "", "0", "", "" ]
					
					int i = 0
					while ((st.nextToken() == StreamTokenizer.TT_WORD)
							|| (st.ttype == '"')
							|| (st.ttype == StreamTokenizer.TT_NUMBER)) {
							
						args[i++] = st.ttype == StreamTokenizer.TT_NUMBER ? (int) st.nval + "" : st.sval
					}
							
					String hexCoords = args[0]
					int elevation = Integer.parseInt(args[1])
					String terrains = args[2]
					String theme = args[3]
					
					int newIndex = indexFor(args[0], numCols, y_pos);
					Hex hex = Hex.createHex(x_pos-1, y_pos-1, elevation, terrains, theme)
					hexMap[newIndex] = hex?.id
					//nd[newIndex] = new Hex(elevation, args[2], args[3], new Coords(x_pos-1,y_pos-1));
					
					x_pos++;
					if (x_pos > numCols) {
						y_pos++
						x_pos = 1
					}
					
				} else if ((st.ttype == StreamTokenizer.TT_WORD) && st.sval.equalsIgnoreCase("end")) {
					break
				}
			}
		} catch (IOException ex) {
			log.error("i/o error reading board")
			log.error(ex)
		} finally {
			if(boardStream != null) {
				boardStream.close()
			}
		}
		
	
		// TODO: if there are any nulls, the board file is invalid
		/*for (int i = 0; i < nd.length; i++) {
			if (nd[i] == null) {
				nd[i] = new Hex();
			}
		}*/
		
		if(numCols > 0 && numRows > 0) {
			board.numCols = numCols
			board.numRows = numRows
			board.hexMap = hexMap
			board.mapLoaded = true
						
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
	
	
	/**
	 * Used to generate the single dimension array index for a two dimensional board
	 * @param hexNum
	 * @param width
	 * @param row
	 * @return
	 */
	private static int indexFor(String hexNum, int width, int row) {
		int substringDiff = 2
		if (row > 99) {
			substringDiff = Integer.toString(width).length()
		}
		int x = Integer.parseInt(hexNum.substring(0, hexNum.length() - substringDiff)) - 1
		int y = Integer.parseInt(hexNum.substring(hexNum.length() - substringDiff)) - 1
		return (y * width) + x
	}
}
