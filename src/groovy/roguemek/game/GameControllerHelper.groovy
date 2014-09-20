package roguemek.game

/**
 * Class used to route to specific actions from the GameController and return the response.
 */
class GameControllerHelper {
	Map params
	
	Game game
	String action
	
	public GameControllerHelper(Map params) {
		this.params = params
		
		this.game = Game.get(params.gameId)
		
		// the params.action is already in use by the controller action
		this.action = params.perform
	}
	
	/**
	 * Calls the method by the name of the action set in the params.perform of the request.
	 * @return The map of data to be converted to JSON at the controller back to the client.
	 */
	public def performAction() {
		if(this.action == null) return
		return this."$action"()
	}
	
	/**
	 * Handles the case where the action called to be performed does not exist as a method.
	 * @param name
	 * @param args
	 * @return
	 */
	private def methodMissing(String name, args) {
		log.info("Missing action name="+name+", args="+args)
		
		// TODO: return with some error about missing action
	}
	
	private def move() {		
		BattleUnit u = game.getUnit(0)
		boolean forward = (params.forward != null) ? params.forward : true
		boolean jumping = (params.jumping != null) ? params.jumping : false
		
		return game.move(u, forward, jumping)
	}
	
	private def rotate() {
		BattleUnit u = game.getUnit(0)
		boolean rotation = (params.rotation != null) ? Boolean.valueOf(params.rotation) : true
		boolean jumping = (params.jumping != null) ? params.jumping : false
		
		if(rotation) {
			return game.rotateHeadingCW(u, jumping)
		}
		else {
			return game.rotateHeadingCCW(u, jumping)
		}
	}
}
