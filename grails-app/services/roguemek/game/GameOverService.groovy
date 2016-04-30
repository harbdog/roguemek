package roguemek.game

import grails.transaction.Transactional

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import org.codehaus.groovy.grails.web.mapping.LinkGenerator
import org.springframework.context.i18n.LocaleContextHolder
import org.springframework.scheduling.annotation.Async

import roguemek.MekUser
import roguemek.stats.WinLoss

@Transactional
class GameOverService {
	
	LinkGenerator grailsLinkGenerator
	
	def messageSource
	
	/**
	 * Checks the game to see if any end game conditions are met, and if so it sets the GAME_OVER status
	 * @param game
	 * @return
	 */
	public def checkEndGameConditions(Game game) {
		if(game == null) return
		
		def endGameData = null
		
		if(game.isOver()) {
			log.trace("Game "+game.id+" is already over")
			endGameData = getEndGameData(game)
			return endGameData
		}
		
		// sort each user out by team, then determine which teams have active units
		def activeTeams = [:]
		def noTeamNum = -1	// users not in a team will have negative "team" number to set them apart
		
		def unitsByUserMap = game.getUnitsByUser()
		unitsByUserMap.each { user, unitList ->
			def teamNum = game.getTeamForUser(user)
			if(teamNum < 0) {
				teamNum = noTeamNum --
			}
			
			for(BattleUnit unit in unitList) {
				if(unit.isActive()) {
					def activeUsers = activeTeams[teamNum]
					if(activeUsers == null) {
						activeUsers = []
						activeTeams[teamNum] = activeUsers
					}
					activeUsers.add(user)
					break
				}
			}
		}
		
		if(activeTeams.size() <= 1) {
			log.info("Game "+game.id+" over due to "+activeTeams.size()+" teams with active units")
			
			game.gameState = Game.GAME_OVER
			game.save flush: true
			
			// record the winners and losers to the database
			unitsByUserMap.each { user, unitList ->
				boolean isWinner = false
				activeTeams.each { teamNum, activeUsers ->
					if(activeUsers.contains(user)) {
						isWinner = true
					}
				}
				
				recordWinLoss(game, user, isWinner)
			}
			
			endGameData = getEndGameData(game)
		}
		
		return endGameData
	}
	
	/**
	 * Gets the return data for the end of the game
	 * @param game
	 * @return
	 */
	public def getEndGameData(Game game) {
		def gameOverHeader = messageSource.getMessage("game.over.debriefing.header", null, LocaleContextHolder.locale)
		def gameOverMessage = messageSource.getMessage("game.over.debriefing", null, LocaleContextHolder.locale)
		def gameOverLabel = messageSource.getMessage("game.over.debriefing.label", null, LocaleContextHolder.locale)
		def gameOverURL = grailsLinkGenerator.link(controller: 'rogueMek', action: 'debrief', id: game.id)
		
		def endGameData = [
			game: game.id,
			gameState: String.valueOf(game.gameState),
			gameOverHeader: gameOverHeader,
			gameOverMessage: gameOverMessage,
			gameOverLabel: gameOverLabel,
			gameOverURL: gameOverURL
		]
		
		return endGameData
	}
	
	/**
	 * Stores the winner/loser user of a given game
	 * @param game
	 * @param user
	 * @param isWinner
	 * @return
	 */
	@Async
	def recordWinLoss(Game game, MekUser user, boolean isWinner) {
		if(game == null || user == null) return
		 
		// make sure this result has not already been recorded, just in case
		WinLoss thisWL = WinLoss.findByGameAndUser(game, user)
		if(thisWL == null) {
			thisWL = new WinLoss(game: game, time: game.updateDate, user: user, winner: isWinner)
			thisWL.save flush: true
		}
		
		return thisWL
	}
   
}
