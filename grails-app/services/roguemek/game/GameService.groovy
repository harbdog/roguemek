package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import org.codehaus.groovy.grails.web.mapping.LinkGenerator
import org.springframework.context.i18n.LocaleContextHolder
import org.atmosphere.cpr.Broadcaster
import org.atmosphere.cpr.BroadcasterFactory

import grails.converters.JSON
import grails.transaction.Transactional
import roguemek.*
import roguemek.model.*
import roguemek.mtf.*
import static org.atmosphere.cpr.MetaBroadcaster.metaBroadcaster

@Transactional
class GameService extends AbstractGameService {
	
	transient springSecurityService
	LinkGenerator grailsLinkGenerator
	
	def messageSource
	def gameChatService
	def gameStagingService
	
	private static Log log = LogFactory.getLog(this)
	
	// TODO: move CombatStatus enum out to a separate class
	public enum CombatStatus {
		UNIT_STANDING("Standing"),
		UNIT_WALKING("Walking"),
		UNIT_RUNNING("Running"),
		UNIT_JUMPING("Jumping"),
		UNIT_IMMOBILE("Immobile"),
		UNIT_PRONE("Prone"),
		UNIT_DESTROYED("Destroyed")
		
		CombatStatus(str) { this.str = str }
		private final String str
		public String toString() { return str }
	}
	
	// TODO: move RelativeDirection enum out to a separate class?
	public enum RelativeDirection {
		FRONT("Front"),
		LEFT("Left"),
		RIGHT("Right"),
		REAR("Rear"),
		
		RelativeDirection(str) { this.str = str }
		private final String str
		public String toString() { return str }
	}
	
	def CLUSTER_HITS = [
		//weapon size 2, 4, 5, 6, 10, 15, 20
		 2:	[1,1,1,2,3,5,6],		// rolled 2
		 3:	[1,2,2,2,3,5,6],
		 4:	[1,2,2,3,4,6,9],
		 5:	[1,2,3,3,6,9,12],
		 6:	[1,2,3,4,6,9,12],
		 7:	[1,3,3,4,6,9,12],		// rolled 7
		 8:	[2,3,3,4,6,9,12],
		 9:	[2,3,4,5,8,12,16],
		10:	[2,3,4,5,8,12,16],
		11:	[2,4,5,6,10,15,20],
		12:	[2,4,5,6,10,15,20]		// rolled 12
	];
	
	/**
	 * Starts the game so it is ready to play the first turn
	 */
	public def initializeGame(Game game) {
		if(game.gameState != Game.GAME_INIT) return
		
		// TODO: if the board is null, pick a random map
		
		// load the board in case is not loaded already
		game.loadMap()
		
		// use staging data to set up the game elements
		StagingHelper.stageGame(game)
		
		// clear any staging data that was used during initialization
		game.clearStagingData()
		
		game.gameState = Game.GAME_ACTIVE
		game.gameTurn = 0
		
		// TODO: perform initiative roll on first and every 4 turns after to change up the order of the units turn
		// game.units...
		game.unitTurn = 0
		
		// get the first unit ready for its turn
		initializeTurnUnit(game)
		
		game.validate()
		if(game.hasErrors()) {
			log.error(game.errors)
			return
		}
		
		def data = [
			gameState: String.valueOf(game.gameState)
		]
		
		game.save flush: true
		
		// let those still in the staging screen be aware of the game state change
		Object[] messageArgs = []
		gameChatService.addMessageUpdate(game, "staging.game.started", messageArgs)
		
		gameStagingService.addStagingUpdate(game, data)
	}
	
	/**
	 * Checks the game to see if any end game conditions are met, and if so it sets the GAME_OVER status
	 * @param game
	 * @return
	 */
	public def checkEndGameConditions(Game game) {
		
		def endGameData = null
		def gameOver = game.isOver()
		
		// TODO: move this function to a new class dedicated to checking win conditions
		
		if(gameOver) {
			log.info("Game "+game.id+" is already over")
		}
		else {
			def unitsByUserMap = game.getUnitsByUser()
			def numActiveUsers = 0
			unitsByUserMap.each{ user, unitList ->
				for(BattleUnit unit in unitList) {
					if(unit.isActive()) {
						numActiveUsers ++
						break
					}
				}
			}
			
			if(numActiveUsers <= 1) {
				log.info("Game "+game.id+" over due to "+numActiveUsers+" users with active units")
				gameOver = true
			}
		}
		
		if(gameOver) {
			game.gameState = Game.GAME_OVER
			game.save flush: true
			
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
	 * Starts the next unit's turn
	 * @return
	 */
	public def initializeNextTurn(Game game) {
		// TODO: apply heat dissipation and heat effects at end of turn instead of beginning of next turn
		
		// Apply any end of turn effects to current turn unit before moving to the next unit's turn
		BattleUnit currentTurnUnit = game.getTurnUnit()
		if(currentTurnUnit != null) {
			checkEndTurnPilotSkill(game, currentTurnUnit)
		}
		
		// check for end-game conditions before continuing to the next turn
		def endGameData = checkEndGameConditions(game)
		if(endGameData != null) {
			// game has ended
			Date update = addMessageUpdate(game, "game.over", null, endGameData)
			return
		}
		
		// if the next turn unit happens to be destroyed, loop to the next one
		BattleUnit nextTurnUnit
		while(nextTurnUnit == null || nextTurnUnit.isDestroyed()) {
			game.unitTurn ++
			if(game.unitTurn >= game.units.size()) {
				game.gameTurn ++
				game.unitTurn = 0
			}
			
			nextTurnUnit = game.getTurnUnit()
			
			// avoid infinite loop if all mechs become destroyed!
			if(currentTurnUnit != null && nextTurnUnit.id == currentTurnUnit.id) {
				log.info("All other mechs destroyed, last unit not destroyed?")
				break;
			}
		}
		
		// update the next unit for its new turn
		def data = initializeTurnUnit(game)
		
		game.save flush: true
		
		// return and add game message about the next unit's turn
		BattleUnit turnUnit = game.getTurnUnit()
		
		Object[] messageArgs = [turnUnit.toString()]
		Date update = addMessageUpdate(game, "game.unit.new.turn", messageArgs, data)
		
		if(turnUnit.isDestroyed() && (currentTurnUnit != null && nextTurnUnit.id != currentTurnUnit.id)) {
			// if the unit is destroyed from something like ammo explosion, proceed to the next unit's turn automatically
			return this.initializeNextTurn(game)
		}
		else if(turnUnit.shutdown) {
			// the unit has been shutdown from overheating, proceed to the next unit's turn automatically
			return this.initializeNextTurn(game)
		}
		
		return data
	}
	
	/**
	 * Initializes the unit for its next turn (updates AP, heat, etc.)
	 * @return
	 */
	private def initializeTurnUnit(Game game) {
		BattleUnit unit = game.getTurnUnit()
		
		def data = [
			turnUnit: unit.id
		]
		
		if(unit instanceof BattleMech) {
			
			def weaponsToCooldown = [:]
			
			for(String equipId in unit.crits) {
				BattleEquipment equip = BattleEquipment.get(equipId)
				
				// update all weapons' cooldown value if on cooldown
				if(equip instanceof BattleWeapon && equip.cooldown > 0) {
					// since each weapon can be referenced multiple times, need to store by id to only reduce once
					weaponsToCooldown[equipId] = equip
				}
			}
			
			for(String equipId in unit.physical) {
				BattleEquipment equip = BattleEquipment.get(equipId)
				
				// update all physical attacks' cooldown value if on cooldown
				if(equip instanceof BattleWeapon && equip.cooldown > 0) {
					weaponsToCooldown[equipId] = equip
				}
			}
			
			if(weaponsToCooldown.size() > 0) {
				data.weaponData = []
				
				for(BattleWeapon weapon in weaponsToCooldown.values()) {
					weapon.cooldown --
					
					// TODO: only return cooldown data to player unit
					def thisWeaponData = [
						weaponId: weapon.id,
						weaponCooldown: weapon.cooldown
					]
					data.weaponData.add(thisWeaponData)
					
					weapon.save flush: true
				}
			}
			
			// update unit.heat value based on heat sinks and current heat amount
			double heatDiss = getHeatDissipation(game, unit)
			unit.heat -= heatDiss
			if(unit.heat < 0) {
				unit.heat = 0
			}
			
			data.heat = unit.heat
			data.heatDiss = heatDiss
			
			// Evaluate if any overheat effects need to apply at this time (shutdown, ammo explosion)
			def heatEffects = HeatEffect.getHeatEffectsAt(unit.heat)
			
			// show effects on the frontend
			data.effects = []
			heatEffects.each{ key, value -> 
				String messageCode = "unit.status.short."+key.toString()
				Object[] messageArgs = [value] as Object[]
				data.effects << messageSource.getMessage(messageCode, messageArgs, LocaleContextHolder.locale)
			}
			
			if(heatEffects.containsKey(HeatEffect.Effect.AMMO_EXP_RISK)) {
				// roll to see if there will be an ammo explosion
				int explosionRisk = heatEffects.getAt(HeatEffect.Effect.AMMO_EXP_RISK)
				
				int explosionRoll = Roll.randomInt(100, 1)
				
				if(explosionRoll < explosionRisk) {
					//  the unit failed the ammo explosion roll, look for the most volatile ammo to asplode
					log.info("Ammo exploding on "+unit+" | "+explosionRoll+"/"+explosionRisk)
					
					def mostExplosiveAmmo
					def mostExplosiveAmmoLocation
					def mostExplosiveAmmoDamage = 0
					def mostExplosiveAmmoRemaining = 0
					
					def allCrits = unit.getAllCritSections()
					allCrits.eachWithIndex { critSection, hitLocation ->
					    for(BattleEquipment thisEquip in critSection) {
							if(thisEquip instanceof BattleAmmo 
									&& thisEquip.isExplosive()
									&& thisEquip.ammoRemaining > 0) {
								// check to see if we have found the most explosive ammo yet
								def thisAmmoRemaining = thisEquip.ammoRemaining
								def thisExplosiveDamage = thisEquip.getExplosiveDamage()
								if(thisExplosiveDamage > mostExplosiveAmmoDamage
										|| (thisExplosiveDamage == mostExplosiveAmmoDamage && thisAmmoRemaining > mostExplosiveAmmoRemaining)) {
									mostExplosiveAmmo = thisEquip
									mostExplosiveAmmoLocation = hitLocation
									mostExplosiveAmmoDamage = thisExplosiveDamage
									mostExplosiveAmmoRemaining = thisAmmoRemaining
								}
							}
						}
					}
					
					if(mostExplosiveAmmo != null) {
						int ammoRemaining = mostExplosiveAmmo.ammoRemaining
						int ammoExplosionDamage = ammoRemaining * mostExplosiveAmmo.getExplosiveDamage()
						
						def ammoCritsHitList = applyDamage(game, ammoExplosionDamage, unit, mostExplosiveAmmoLocation)
						unit.save flush:true
						
						mostExplosiveAmmo.status = BattleEquipment.STATUS_DESTROYED
						mostExplosiveAmmo.ammoRemaining = 0
						mostExplosiveAmmo.save flush:true
						
						// TODO: make the applyDamage method return hash of locations damaged instead of the entire armor/internals array
						def explosionData = [
							unit: unit.id,
							target: unit.id,
							damage: ammoExplosionDamage,
							hitLocation: mostExplosiveAmmoLocation,
							armorHit: unit.armor,
							internalsHit: unit.internals
						]
						
						def locationStr = Mech.getLocationText(mostExplosiveAmmoLocation)
						
						Object[] messageArgs = [unit.toString(), String.valueOf(ammoExplosionDamage), locationStr]
						Date update = addMessageUpdate(game, "game.unit.ammo.explosion", messageArgs, explosionData)
						
						// perform piloting check on target if certain criticals received damage from weapons fire
						checkCriticalsHitPilotSkill(game, unit, ammoCritsHitList)
						
						// TODO: figure out why the unit may not getting conveyed as destroyed from start of turn ammo explosion to the UI
					}
				}
			}
			
			if(heatEffects.containsKey(HeatEffect.Effect.SHUTDOWN_RISK)) {
				// Roll to see if an automatic shutdown is going to occur
				int shutdownPercent = heatEffects.getAt(HeatEffect.Effect.SHUTDOWN_RISK)
				
				if(shutdownPercent >= 100) {
					// TODO: Shutdown the unit
					log.info("Auto shutting down "+unit)
					unit.shutdown = true
				}
				else {
					int shutdownRoll = Roll.randomInt(100, 1)
					
					if(shutdownRoll < shutdownPercent) {
						// TODO: Shutdown the unit
						log.info("Shutting down "+unit+" | "+shutdownRoll+"/"+shutdownPercent)
						unit.shutdown = true
					}
					else {
						// Power up the unit if previously shutdown
						log.info("Shutdown avoided "+unit+" | "+shutdownRoll+"/"+shutdownPercent)
						unit.shutdown = false
					}
				}
			}
			else if(unit.shutdown) {
				// Power up the unit if previously shutdown
				log.info("Shutdown ended "+unit)
				unit.shutdown = false
			}
			
			data.shutdown = unit.shutdown
			
			// generate the amount of AP/JP per turn based on MP, Jets and Heat effects
			unit.actionPoints = getUnitAP(game, unit)
			unit.apRemaining = unit.actionPoints
			data.apRemaining = unit.apRemaining
			
			unit.jumpPoints = getUnitJP(game, unit)
			if(game.gameTurn == 0) {
				// intitialize jump jets to full amount on the first turn of the game
				unit.jpRemaining = unit.jumpPoints
			}
			else if(unit.jpRemaining < unit.jumpPoints) {
				// units only regenerate 1 JP per turn
				unit.jpRemaining ++
			}
			else if(unit.jpRemaining > unit.jumpPoints) {
				// units can only have as many JP as they are allowed based on battle conditions
				unit.jpRemaining = unit.jumpPoints
			}
			data.jpRemaining = unit.jpRemaining
			data.jumping = false
			data.jumpCapable = (unit.jumpPoints > 0)
			
			def moveAP = null
			if(unit.apRemaining > 0) {
				def forwardAP = this.getMoveAP(game, unit, true, false)
				def backwardAP = this.getMoveAP(game, unit, false, false)
				
				moveAP = [
					forward: forwardAP,
					backward: backwardAP
				]
			}
			data.moveAP = moveAP
		}
		
		// reset ap/hexes moved for the new turn
		unit.apMoved = 0
		unit.jpMoved = -1	// initializes at -1 since rotation costs 0 JP
		unit.hexesMoved = 0
		
		// reset damage taken for the new turn
		unit.damageTaken = 0
		unit.damageTakenCheck = false
		
		unit.save flush: true
		
		return data
	}
	
	/**
	 * Calculates the amount of ActionPoints a unit gets for a new turn.
	 * 1 AP is given per 2 run MP (walk MP * 1.5 rounded up).
	 * @param game
	 * @param unit
	 * @return
	 */
	private int getUnitAP(Game game, BattleUnit unit) {
		
		int ap = 0
		
		if(unit instanceof BattleMech) {
			// calculate reductions based on heat/crit status
			int walkMPReduce = getReduceWalkMP(unit);
			int walkMPThisTurn = unit.mech.walkMP - walkMPReduce
			
			if(walkMPThisTurn <= 0) {
				// TODO: when WalkMP is 0, make AP only usable for weapons fire?
				return 0
			}
			
			int runMPThisTurn = Math.ceil(walkMPThisTurn * 1.5)
			
			ap = Math.floor(runMPThisTurn / 2) + (runMPThisTurn % 2)
		}
		
		return ap
	}
	
	/**
	 * Returns the amount of movement points to reduce from the mech's speed due to heat effects, leg damage, etc
	 * @param unit
	 * @return
	 */
	private int getReduceWalkMP(BattleUnit unit){
		int reduce = 0;
		
		if(unit instanceof BattleMech) {
			Mech mech = unit.mech
			
			if(unit.isLegged()) {
				// a legged mech automatically only gets 1 MP
				reduce = mech.walkMP - 1
			}
			else {
				// reductions for leg damage, engine damage, etc
				int hipHits = 0;
				int upLegHits = 0;
				int lowLegHits = 0;
				int footHits = 0;
				for(int legIndex in Mech.LEGS){
					BattleEquipment[] sectionCrits = unit.getCritSection(legIndex)
					// Check legs for hip/actuator hits
					for(BattleEquipment thisCrit in sectionCrits) {
						if(!thisCrit.isActive()) {
							if(MechMTF.MTF_CRIT_HIP == thisCrit.getName()){
								hipHits ++
							}
							else if(MechMTF.MTF_CRIT_UP_LEG_ACT == thisCrit.getName()){
								upLegHits ++
							}
							else if(MechMTF.MTF_CRIT_LOW_LEG_ACT == thisCrit.getName()){
								lowLegHits ++
							}
							else if(MechMTF.MTF_CRIT_FOOT_ACT == thisCrit.getName()){
								footHits ++
							}
						}
					}
				}
				
				if(hipHits == 2){
					// 0 WalkMP for 2 hips hits (supercedes any actuator hits, unless legged)
					reduce = mech.walkMP
				}
				else if(hipHits == 1){
					// 1/2 WalkMP  for 1 hip hit (supercedes any actuator hits)
					reduce = Math.floor(mech.walkMP / 2)
				}
				else{
					// -1 WalkMP for each actuator hit
					reduce = upLegHits + lowLegHits + footHits
				}
			}
			
			if(unit.heat >= HeatEffect.MIN_HEAT_EFFECT) {
				HeatEffect thisEffect = HeatEffect.getHeatEffectForTypeAt(HeatEffect.Effect.MP_REDUCE, unit.heat)
				if(thisEffect != null) {
					reduce += thisEffect.value
				}
			}
			
			if(reduce > mech.walkMP) {
				reduce = mech.walkMP
			}
		}
		
		return reduce;
	}
	
	/**
	 * Calculates the amount of JumpPoints a unit gets for a new turn
	 * based on its jump MP and 1 JP recharged per round.
	 * @param game
	 * @param unit
	 * @return
	 */
	private int getUnitJP(Game game, BattleUnit unit) {
		
		/*if(mech.jumpMP == 0)
			return 0;
		
		def jumpMPReduce = getReduceJumpMP(mech);
		def jumpMPThisTurn = mech.jumpMP - jumpMPReduce;
		
		if(jumpMPThisTurn <= 0){
			return 0;
		}
		
		def maxJP = Math.floor(jumpMPThisTurn / 2) + (jumpMPThisTurn % 2);
		
		def jp = mech.jumpPoints + 1;
		if(jp > maxJP){
			jp = maxJP;
		}*/
		
		// generate actual jumpPoints based on functioning jump jets
		int jp = 0
		
		if(unit instanceof BattleMech) {
			// calculate reductions based on heat/crit status
			int jumpMPReduce = getReduceJumpMP(game, unit);
			int jumpMPThisTurn = unit.mech.jumpMP - jumpMPReduce
			
			if(jumpMPThisTurn <= 0) {
				return 0
			}
			
			jp = Math.floor(jumpMPThisTurn / 2) + (jumpMPThisTurn % 2)
		}
		
		return jp
	}
	
	/**
	 * Returns the amount of movement points to reduce from the mech's speed due to heat effects, leg damage, etc
	 * @param unit
	 * @return
	 */
	private int getReduceJumpMP(Game game, BattleUnit unit){
		int reduce = 0;
		
		if(unit instanceof BattleMech) {
			Mech mech = unit.mech
			
			Hex currentHex = game.getHexAt(unit.getLocation())
			int currentWaterLevel = currentHex.getTerrainLevel(Terrain.WATER)
			
			if(currentWaterLevel >= 2) {
				// a unit fully submerged in water cannot jump
				reduce = mech.jumpMP
			}
			else {
				// reductions for jump jet damage or depth 1 water for leg jets
				int jetsDisabled = 0;

				for(int legIndex in Mech.LEGS){
					BattleEquipment[] sectionCrits = unit.getCritSection(legIndex)
					// Check legs for hip/actuator hits
					for(BattleEquipment thisCrit in sectionCrits) {
						if(!thisCrit.isActive() 
								|| currentWaterLevel == 1) {
							if(MechMTF.MTF_CRIT_JUMPJET == thisCrit.getName()){
								jetsDisabled ++
							}
						}
					}
				}
				
				for(int torsoIndex in Mech.TORSOS){
					BattleEquipment[] sectionCrits = unit.getCritSection(torsoIndex)
					// Check legs for hip/actuator hits
					for(BattleEquipment thisCrit in sectionCrits) {
						if(!thisCrit.isActive()) {
							if(MechMTF.MTF_CRIT_JUMPJET == thisCrit.getName()){
								jetsDisabled ++
							}
						}
					}
				}
				
				if(jetsDisabled > 0) {
					reduce = jetsDisabled 
				}
			}
			
			if(reduce > mech.jumpMP) {
				reduce = mech.jumpMP
			}
		}
		
		return reduce;
	}
	
	/**
	 * Gets all applicable data for the board HexMap object that can be turned into JSON for initializing the client
	 * @return
	 */
	public def getHexMapRender(Game game) {
		HexMap board = game?.board?.getHexMap()
		
		def hexList = []
		board.hexMap?.each { hexId ->
			Hex h = Hex.get(hexId)
			hexList.add(h?.getHexRender())
		}
		
		def hexMapRender = [
			numCols: board.numCols,
			numRows: board.numRows,
			hexMap: hexList
		]
		
		return hexMapRender
	}
	
	/**
	 * Gets all applicable data for all units that can be turned into JSON for initializing the client
	 * @return
	 */
	public def getUnitsRender(Game game) {
		def unitsRender = []
		
		game.units?.each { BattleUnit u ->
			
			def armor = null
			def initialArmor = null
			def internals = null
			def initialInternals = null
			def chassisVariant = null
			def crits = null
			def heatDiss = 0
			def physical = null
			
			if(u instanceof BattleMech) {
				Mech m = u.mech
				chassisVariant = (m == null) ?: m.chassis+"-"+m.variant
				
				armor = []
				if(u.armor != null) {
					int armorSize = u.armor.size();
					for(int i=0; i<armorSize; i++) {
						armor[i] = u.armor[i]
					}
				}
				initialArmor = []
				if(m.armor != null) {
					int armorSize = m.armor.size();
					for(int i=0; i<armorSize; i++) {
						initialArmor[i] = m.armor[i]
					}
				}
				
				internals = []
				if(u.internals != null) {
					int internalSize = u.internals.size()
					for(int i=0; i<internalSize; i++) {
						internals[i] = u.internals[i]
					}
				}
				initialInternals = []
				if(m.internals != null) {
					int internalSize = m.internals.size()
					for(int i=0; i<internalSize; i++) {
						initialInternals[i] = m.internals[i]
					}
				}
				
				crits = getCritsRender(u)
				
				physical = getPhysicalAttacksRender(u)
				
				heatDiss = getHeatDissipation(game, u)
			}
			
			CombatStatus unitStatus = getUnitCombatStatus(game, u)
			
			// Evaluate if any overheat effects need to apply at this time (shutdown, ammo explosion)
			def heatEffects = HeatEffect.getHeatEffectsAt(u.heat)
			
			// show effects on the frontend
			def effects = []
			heatEffects.each{ key, value ->
				String messageCode = "unit.status.short."+key.toString()
				Object[] messageArgs = [value] as Object[]
				effects << messageSource.getMessage(messageCode, messageArgs, LocaleContextHolder.locale)
			}
			
			def uRender = [
				unit: u.id,
				callsign: u.pilot?.ownerUser?.callsign,
				name: u.mech?.name,
				chassisVariant: chassisVariant,
				mass: u.mech?.mass,
				x: u.x,
				y: u.y,
				heading: u.heading,
				status: String.valueOf(u.status),
				effects: effects,
				prone: u.prone,
				shutdown: u.shutdown,
				apRemaining: u.apRemaining,
				jpRemaining: u.jpRemaining,
				jumpJets: u.mech?.jumpMP,
				jumping: (unitStatus == CombatStatus.UNIT_JUMPING),
				heat: u.heat,
				heatDiss: heatDiss,
				armor: armor,
				initialArmor: initialArmor,
				internals: internals,
				initialInternals: initialInternals,
				crits: crits,
				physical: physical,
				imageFile: u.imageFile,
				image: u.image,
				rgb: [u.rgb[0], u.rgb[1], u.rgb[2]]
			]
			
			unitsRender.add(uRender)
		}
		
		return unitsRender
	}
	
	/**
	 * Gets each critical slot into a form that can be turned into JSON for the client
	 * @return
	 */
	public def getCritsRender(BattleUnit u) {
		if(u == null) return null
		
		def critsRender = []
		if(u instanceof BattleMech) {
			for(int i=0; i<u.crits.size(); i++) {
				critsRender[i] = getEquipmentRender(u, BattleEquipment.get(u.crits[i]))
			}
		}
		
		return critsRender
	}
	
	/**
	 * Gets each phsyical attack weapon into a form that can be turned into JSON for the client
	 * @return
	 */
	public def getPhysicalAttacksRender(BattleUnit u) {
		if(u == null) return null
		
		def physicalRender = []
		if(u instanceof BattleMech) {
			for(int i=0; i<u.physical.size(); i++) {
				physicalRender[i] = getEquipmentRender(u, BattleEquipment.get(u.physical[i]))
			}
		}
		
		return physicalRender
	}
	
	/**
	 * Gets a JSON compatible form of Equipment data for the client
	 * @param equip
	 * @return
	 */
	public def getEquipmentRender(BattleUnit unit, BattleEquipment equip) {
		if(equip == null) return null
		
		Equipment e = equip.equipment
		
		// Basic Equipment stuff first
		def equipRender = [
			id: equip.id,	// TODO: BattleEquipment initialization will need to be changed so equipment taking >1 slots point to same id
			name: e.name,
			shortName: e.shortName,
			location: equip.location,
			status: String.valueOf(equip.status),
			type: "Equipment"
		]
		
		if(e instanceof HeatSink) {
			equipRender.type = "HeatSink"
			equipRender.dissipation = e.dissipation
		}
		
		if(e instanceof Ammo) {
			equipRender.type = "Ammo"
			equipRender.ammoPerTon = e.ammoPerTon
			equipRender.ammoExplosiveDamage = e.explosiveDamage
		}
		if(equip instanceof BattleAmmo) {
			equipRender.ammoRemaining = equip.ammoRemaining
		}
		
		if(e instanceof Weapon) {
			equipRender.type = "Weapon"
			equipRender.weaponType = e.weaponType;
			equipRender.damage = e.damage
			equipRender.heat = e.heat
			equipRender.cycle = e.cycle
			equipRender.projectiles = e.projectiles
			equipRender.minRange = e.minRange
			equipRender.shortRange = e.shortRange
			equipRender.mediumRange = e.mediumRange
			equipRender.longRange = e.longRange
			
			// add each BattleAmmo id applicable for this weapon 
			if(e.ammoTypes != null && e.ammoTypes.size() > 0) {
				equipRender.ammo = []
				for(Ammo ammo in e.ammoTypes) {
					BattleAmmo[] ammoCrits = unit.getEquipmentFromBaseObject(ammo)
					for(BattleAmmo ammoEquip in ammoCrits) {
						equipRender.ammo.add(ammoEquip.id)
					}
				}
			}
		}
		if(equip instanceof BattleWeapon) {
			equipRender.cooldown = equip.cooldown
		}
		
		if(e instanceof JumpJet) {
			equipRender.type = "JumpJet"
		}
		
		return equipRender
	}
	
	/**
	 * Skips the remainder of the current unit's turn
	 * @param game
	 * @param unit
	 * @return
	 */
	public def skipTurn(Game game, BattleUnit unit) {
		if(unit != game.getTurnUnit()) {
			if(isRootUser()) {
				// allow root user to skip another unit's turns for testing purposes
			}
			else {
				return
			}
		}
		
		return initializeNextTurn(game)
	}
	
	/**
	 * Determines amount of AP for movement to be relayed to client
	 * @param game
	 * @param unit
	 * @param forward
	 * @param jumping
	 * @return
	 */
	public static def getMoveAP(Game game, BattleUnit unit, boolean forward, boolean jumping) {
		if(unit.apRemaining == 0) return 0
		else if(unit != game.getTurnUnit()) return 0
		else if(unit.prone) {
			// if the unit is prone, it must first stand up
			return forward ? 1 : -1
		}
		
		int moveHeading = forward ? unit.heading : ((unit.heading + 3) % 6)
		Coords unitCoords = unit.getLocation()
		
		// check to see if the new hex can be moved into
		Coords moveCoords = GameService.getForwardCoords(game, unitCoords, moveHeading)
		
		def notMoving = (moveCoords.equals(unitCoords))
		if(notMoving) {
			return -1
		}
		
		// check to see if there is another unit already in the coords
		def unitObstacles = game.getUnitsAt(moveCoords.x, moveCoords.y)
		if(unitObstacles.length > 0) {
			// TODO: Charging/DFA if a unit is present at the new coords
			return -1
		}
		
		// calculate the amount of AP required to move
		int apRequired = jumping ? getHexRequiredJP(game, unitCoords, moveCoords) 
								 : getHexRequiredAP(game, unitCoords, moveCoords)
		
		if(jumping) {
			// no AP modifiers needed when jumping
		}
		else if(apRequired > unit.apRemaining && apRequired > unit.actionPoints
					&& unit.apMoved == 0
					&& apRequired == unit.actionPoints + 1) {
			// if a mech wants to move to a location that requires more than its max AP
			// lets allow it, but make it require the full amount of AP for the turn and only up to one additional AP
			apRequired = unit.actionPoints
		}
		
		return apRequired
	}
	
	/**
	 * Moves the unit in a forward/backward direction
	 * @param game
	 * @param unit
	 * @param forward
	 * @param jumping
	 * @return
	 */
	public def move(Game game, BattleUnit unit, boolean forward, boolean jumping) {
		return move(game, unit, forward, jumping, false)
	}
	/**
	 * Moves the unit in a forward/backward direction
	 * @param game
	 * @param unit
	 * @param forward
	 * @param jumping
	 * @param isAutomatic, is only set true if the move is the result of another action and is being performed automatically on its behalf (e.g. charging, DFA)
	 * @return
	 */
	public def move(Game game, BattleUnit unit, boolean forward, boolean jumping, boolean isAutomatic) {
		if(unit != game.getTurnUnit()) return
		
		if(unit.apRemaining == 0) {
			// not enough action points to move
			return new GameMessage("game.you.cannot.move.ap.zero", null, null)
		}
		else if(jumping && unit.jpRemaining == 0) {
			// not enough jump points to jump
			return new GameMessage("game.you.cannot.move.jp.zero", null, null)
		}
		
		// TODO: Instead, store combat status directly on the unit as a new field?
		CombatStatus prevUnitStatus = getUnitCombatStatus(game, unit)
		
		// prevent unit from jumping and walking/running in the same turn
		if(jumping) {
			if(prevUnitStatus != CombatStatus.UNIT_JUMPING && prevUnitStatus != CombatStatus.UNIT_STANDING) {
				// unit was not standing still or already jumping, deny the jump
				return new GameMessage("game.you.cannot.jump.moving", null, null)
			}
		}
		else{
			if(prevUnitStatus == CombatStatus.UNIT_JUMPING) {
				// unit was jumping, deny the move
				return new GameMessage("game.you.cannot.move.jumping", null, null)
			}
		}
		
		boolean attemptingStanding = unit.prone
		
		int moveHeading = forward ? unit.heading : ((unit.heading + 3) % 6)
		Coords unitCoords = unit.getLocation()
		
		// check to see if the new hex can be moved into
		Coords moveCoords = attemptingStanding ? unitCoords : GameService.getForwardCoords(game, unitCoords, moveHeading)
		
		if(attemptingStanding) {
			// unit attempting to stand will not be moving to a new hex
		}
		else{
			def notMoving = (moveCoords.equals(unitCoords))
			if(notMoving) {
				return new GameMessage("game.you.cannot.move.edge", null, null)
			}
			
			// check to see if there is another unit already in the coords
			def unitObstacles = game.getUnitsAt(moveCoords.x, moveCoords.y)
			if(unitObstacles.length > 0) {
				return new GameMessage("game.you.cannot.move.unit", null, null)
			}
		}
		
		// calculate the amount of AP required to move
		int apRequired = attemptingStanding ? 1
							: jumping ? getHexRequiredJP(game, unitCoords, moveCoords) 
								 : getHexRequiredAP(game, unitCoords, moveCoords)
		
		if(jumping) {
			// no AP modifiers needed when jumping
		}
		else if(apRequired > unit.apRemaining && apRequired > unit.actionPoints 
				&& unit.apMoved == 0
				&& apRequired == unit.actionPoints + 1) {
			// if a mech wants to move to a location that requires more than its max AP
			// lets allow it, but make it require the full amount of AP for the turn and only up to one additional AP
			apRequired = unit.actionPoints
		}
			
		// make sure the terrain can be entered using AP
		if(unit.apRemaining < apRequired) {
			Object[] messageArgs = [apRequired]
			return new GameMessage("game.you.cannot.move.ap", messageArgs, null)
		}
		else if(jumping && unit.jpRemaining < apRequired) {
			Object[] messageArgs = [apRequired]
			return new GameMessage("game.you.cannot.move.jp", messageArgs, null)
		}
		else if (apRequired < 0) {
			return new GameMessage("game.you.cannot.move.direction", null, null)
		}
		
		// When ready to move, set the new location of the unit and consume AP
		unit.apRemaining -= apRequired
		unit.apMoved ++
		
		boolean initiatedJumping = false
		if(jumping) {
			if(unit.jpMoved < 0) {
				unit.jpMoved = 0
				initiatedJumping = true
			}
			unit.jpRemaining -= apRequired
			unit.jpMoved ++
		}
		
		if(attemptingStanding) {
			// unit is attempting to stand, perform piloting skill check before allowing it
			def modifiers = PilotingModifier.getPilotSkillModifiers(game, unit, PilotingModifier.Modifier.MECH_STANDING)
			def checkSuccess = doPilotSkillCheck(game, unit, modifiers)
		}
		else {
			unit.hexesMoved ++
			unit.x = moveCoords.x
			unit.y = moveCoords.y
		}
		
		// If changing movement status to WALKING or RUNNING, add the appropriate heat
		CombatStatus unitStatus = getUnitCombatStatus(game, unit)
		double heatGen = 0
		if(unitStatus == CombatStatus.UNIT_WALKING 
				&& prevUnitStatus != CombatStatus.UNIT_WALKING) {
			// Add 1 heat per round for starting to walk
			heatGen = 1
		}
		else if(unitStatus == CombatStatus.UNIT_RUNNING 
				&& prevUnitStatus == CombatStatus.UNIT_WALKING) {
			// Add 1 heat per round for going from walk to run
			heatGen = 1
		}
		else if(unitStatus == CombatStatus.UNIT_RUNNING 
				&& prevUnitStatus != CombatStatus.UNIT_WALKING 
				&& prevUnitStatus != CombatStatus.UNIT_RUNNING) {
			// Add 2 heat per round for going straight to run
			heatGen = 2
		}
		else if(unitStatus == CombatStatus.UNIT_JUMPING) {
			// add heat for JUMPING, the initial jump is 3 heat, then after 3 jumps more heat is generated
			if(unit.jpMoved > 3) {
				heatGen = 1
			}
			else if(initiatedJumping){
				heatGen = 3
			}
		}

		unit.heat += heatGen
		
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		def moveAP = null
		if(unit.apRemaining > 0
				&& !isAutomatic) {
			// generate the forward and backward AP amounts for the UI to display
			def forwardAP = this.getMoveAP(game, unit, true, jumping)
			def backwardAP = this.getMoveAP(game, unit, false, jumping)
			
			moveAP = [
				forward: forwardAP,
				backward: backwardAP
			]
		}
		
		def data = [
			unit: unit.id,
			x: unit.x,
			y: unit.y,
			apRemaining: unit.apRemaining,
			apMoved: unit.apMoved,
			jpRemaining: unit.jpRemaining,
			jpMoved: unit.jpMoved,
			jumping: jumping,
			jumpCapable: (unit.jumpPoints > 0 && (unit.apMoved == 0 || unit.jpMoved >= 0)),
			heat: unit.heat,
			moveAP: moveAP
		]
		
		// attempting to stand does not need a message since it would have already been done based on pilot skill roll
		def moveMessage = attemptingStanding ? null 
							: jumping ? "game.unit.jumped" 
								: "game.unit.moved"
					
		Object[] messageArgs = [unit.toString(), unit.x, unit.y]
		Date update = addMessageUpdate(
				game, 
				moveMessage, 
				messageArgs, data)
		
		if(unit.apRemaining == 0
				&& !jumping
				&& !isAutomatic) {
			// automatically end the unit's turn if it has run out of AP if it was not jumping
			this.initializeNextTurn(game)
		}
		
		return data
	}
	
	/**
	 * Rotates the unit to the given heading
	 * @param unit
	 * @param newHeading
	 * @param jumping
	 * @return
	 */
	public def rotateHeading(Game game, BattleUnit unit, int newHeading, boolean jumping){
		if(unit != game.getTurnUnit()) return
		
		if(unit.apRemaining == 0
				&& !jumping) {
			// no action points to rotate with (but allow jump rotation)
			return new GameMessage("game.you.cannot.move.ap.zero", null, null)
		}
		
		// TODO: TESTING: Instead, store combat status directly on the unit as a new field?
		CombatStatus prevUnitStatus = getUnitCombatStatus(game, unit)
		
		// prevent unit from jumping and walking/running in the same turn
		if(jumping) {
			if(prevUnitStatus != CombatStatus.UNIT_JUMPING && prevUnitStatus != CombatStatus.UNIT_STANDING) {
				// unit was not standing still or already jumping, deny the jump
				return new GameMessage("game.you.cannot.jump.moving", null, null)
			}
		}
		else{
			if(prevUnitStatus == CombatStatus.UNIT_JUMPING) {
				// unit was jumping, deny the move
				return new GameMessage("game.you.cannot.move.jumping", null, null)
			}
		}
		
		double heatGen = 0
		
		if(jumping) {
			// rotation while jumping does not cost any AP or build additional heat
			// but if not yet jump it needs to indicate by setting JP moved to 0
			if(unit.jpMoved < 0) {
				unit.jpMoved = 0
				
				// minimum of 3 heat generated when jump jets are engaged
				heatGen = 3
			}
		}
		else {
			// use an actionPoint and register one apMoved
			unit.apRemaining -= 1
			unit.apMoved ++
			
			// If changing movement status to WALKING or RUNNING, add the appropriate heat
			CombatStatus unitStatus = getUnitCombatStatus(game, unit)
			
			if(unitStatus == CombatStatus.UNIT_WALKING
					&& prevUnitStatus != CombatStatus.UNIT_WALKING) {
				// Add 1 heat per round for starting to walk
				heatGen = 1
			}
			else if(unitStatus == CombatStatus.UNIT_RUNNING
					&& prevUnitStatus == CombatStatus.UNIT_WALKING) {
				// Add 1 heat per round for going from walk to run
				heatGen = 1
			}
			else if(unitStatus == CombatStatus.UNIT_RUNNING
					&& prevUnitStatus != CombatStatus.UNIT_WALKING
					&& prevUnitStatus != CombatStatus.UNIT_RUNNING) {
				// Add 2 heat per round for going straight to run
				heatGen = 2
			}
		}
		
		unit.heat += heatGen
		
		// When ready to rotate, set the new location of the unit
		unit.setHeading(newHeading);
		
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		def moveAP = null
		if(unit.apRemaining > 0) {
			def forwardAP = this.getMoveAP(game, unit, true, jumping)
			def backwardAP = this.getMoveAP(game, unit, false, jumping)
			
			moveAP = [
				forward: forwardAP,
				backward: backwardAP
			]
		}
		
		def data = [
			unit: unit.id,
			heading: unit.heading,
			apRemaining: unit.apRemaining,
			apMoved: unit.apMoved,
			jpRemaining: unit.jpRemaining,
			jpMoved: unit.jpMoved,
			jumping: jumping,
			jumpCapable: (unit.jumpPoints > 0 && (unit.apMoved == 0 || unit.jpMoved >= 0)),
			heat: unit.heat,
			moveAP: moveAP
		]
		
		Object[] messageArgs = [unit.toString(), unit.heading]
		Date update = addMessageUpdate(
				game, 
				jumping ? "game.unit.jump.rotated" : "game.unit.rotated", 
				messageArgs, data)
		
		if(unit.apRemaining == 0
				&& !jumping) {
			// automatically end the unit's turn if it has run out of AP when not jumping
			this.initializeNextTurn(game)
		}
		
		return data
	}
	
	/**
	 * Rotates the given unit's heading Clockwise
	 * @param unit
	 * @param jumping
	 * @return
	 */
	public def rotateHeadingCW(Game game, BattleUnit unit, boolean jumping){
		return this.rotateHeading(game, unit, GameService.getRotateHeadingCW(unit.heading), jumping);
	}
	
	/**
	 * Returns the Clockwise heading relative to the given heading
	 * @param heading
	 * @return
	 */
	public static int getRotateHeadingCW(heading){
		return (heading + 1) % 6;
	}
	
	/**
	 * Rotates the given unit's heading Counter Clockwise
	 * @param unit
	 * @param jumping
	 * @return
	 */
	public def rotateHeadingCCW(Game game, BattleUnit unit, boolean jumping){
		return this.rotateHeading(game, unit, GameService.getRotateHeadingCCW(unit.heading), jumping);
	}
	
	/**
	 * Returns the Counter Clockwise heading relative to the given heading
	 * @param heading
	 * @return
	 */
	public static int getRotateHeadingCCW(heading){
		return (heading + 5) % 6;
	}
	
	/**
	 * Gets the coordinate of the hex that would be in front of the given coordinates+heading
	 * @param fromCoords
	 * @param heading
	 * @return
	 */
	public static Coords getForwardCoords(Game game, Coords fromCoords, int heading) {
		HexMap board = game?.board?.getHexMap()
		if(board == null) return null
		
		def x = fromCoords.x;
		def y = fromCoords.y;
		
		def newXY = new Coords(x, y);
		switch(heading){
			case BattleUnit.HEADING_N:
				if(y > 0){
					newXY = new Coords(x,y-1);
				}
				break;
				
			case BattleUnit.HEADING_NE:
				if(x % 2 == 0 && x < board.numCols - 1 && y > 0){
					newXY = new Coords(x+1,y-1);
				}
				else if(x % 2 != 0 && x < board.numCols - 1){
					newXY = new Coords(x+1,y);
				}
				break;
				
			case BattleUnit.HEADING_SE:
				if(x % 2 == 0 && x < board.numCols - 1){
					newXY = new Coords(x+1,y);
				}
				else if(x % 2 != 0 && x < board.numCols - 1 && y < board.numRows - 1){
					newXY = new Coords(x+1,y+1);
				}
				break;
				
			case BattleUnit.HEADING_S:
				if(y < board.numRows - 1){
					newXY = new Coords(x,y+1);
				}
				break;
				
			case BattleUnit.HEADING_SW:
				if(x % 2 == 0 && x > 0){
					newXY = new Coords(x-1,y);
				}
				else if(x % 2 != 0 && x > 0 && y < board.numRows - 1){
					newXY = new Coords(x-1,y+1);
				}
				break;
				
			case BattleUnit.HEADING_NW:
				if(x % 2 == 0 && x > 0 && y > 0){
					newXY = new Coords(x-1,y-1);
				}
				else if(x % 2 != 0 && x > 0){
					newXY = new Coords(x-1,y);
				}
				break;
		}
		
		return newXY;
	}
	
	/**
	 * Handles displacement for any unit being displaced
	 * @param game
	 * @param unit
	 * @param jumping
	 * @return
	 */
	public Coords handleDisplacement(Game game, BattleUnit unit, int displaceHeading){
		
		Coords unitLocation = unit.getLocation()
		Coords displacedLocation = getForwardCoords(game, unitLocation, displaceHeading)
		
		Hex origHex = game.getHexAt(unitLocation)
		Hex displacedHex = game.getHexAt(displacedLocation)
		
		if(!displacedLocation.equals(unitLocation) 
				&& displacedHex != null 
				&& origHex.elevation + 1 >= displacedHex.elevation){
				
			// looking for a mech present at the new location in case this triggers a domino effect
			def obstacles = game.getUnitsAt(displacedLocation.x, displacedLocation.y)
			
			for(BattleUnit unitObstacle in obstacles) {
				if(unitObstacle != null){
					def obstacleDisplacedLocation = handleDisplacement(game, unitObstacle, displaceHeading)
					
					if(obstacleDisplacedLocation == null){
						// mech obstacle couldn't displace, so neither will this unit
						displacedLocation = null
					}
					else{
						// TODO: handle potentially being force displacement from accidental falls from above (>1 elevation level above)
					}
					
					// mech obstacle must make a pilot skill roll to avoid falling from domino effect
					def modifiers = PilotingModifier.getPilotSkillModifiers(game, unitObstacle, PilotingModifier.Modifier.MECH_PUSHED)
					def checkSuccess = doPilotSkillCheck(game, unitObstacle, modifiers)
				}
			}
		}
		else{
			// unit cannot be displaced
			displacedLocation = null
		}
		
		if(displacedLocation != null){
			// unit displaced to new location
			unit.x = displacedLocation.x
			unit.y = displacedLocation.y
			
			unit.save flush:true
			
			def data = [
				unit: unit.id,
				x: unit.x,
				y: unit.y
			]
			
			Object[] messageArgs = [unit.toString(), unit.x, unit.y]
			Date update = addMessageUpdate(
					game,
					"game.unit.displaced",
					messageArgs, data)
		}
		
		return displacedLocation
	}
	
	/**
	 * Toggles the jumping mode of the unit, mainly to give back information about what jumping costs
	 * @param game
	 * @param unit
	 * @param jumping
	 * @return
	 */
	public def toggleJumping(Game game, BattleUnit unit, boolean jumping) {
		if(unit.apRemaining == 0) return
		else if(unit != game.getTurnUnit()) return
		
		if(jumping && unit.jumpPoints == 0) {
			jumping = false
		}
		
		CombatStatus prevUnitStatus = getUnitCombatStatus(game, unit)
		
		// prevent unit from jumping and walking/running in the same turn
		if(jumping) {
			if(prevUnitStatus != CombatStatus.UNIT_JUMPING && prevUnitStatus != CombatStatus.UNIT_STANDING) {
				// unit was not standing still or already jumping, deny enabling jumping
				def data = [
					unit: unit.id,
					jumping: false,
					message: new GameMessage("game.you.cannot.jump.moving", null, null)
				]
				return data
			}
			
			if(unit.jpMoved < 0) {
				// set indicator for jumping
				unit.jpMoved = 0
				
				// apply initial heat for jumping
				def heatGen = 3
				unit.heat += heatGen
				
				unit.save flush: true, deepValidate: false
				
				def data = [
					unit: unit.id,
					jpMoved: unit.jpMoved,
					jumping: jumping
				]
				
				def jumpMessage = "game.unit.jumping"
				Object[] messageArgs = [unit.toString()]
				Date update = addMessageUpdate(
								game,
								jumpMessage,
								messageArgs, data)
			}
		}
		else{
			if(prevUnitStatus == CombatStatus.UNIT_JUMPING) {
				// unit was jumping, deny disabling jumping
				def data = [
					unit: unit.id,
					jumping: true,
					message: new GameMessage("game.you.cannot.move.jumping", null, null)
				]
				return data
			}
		}
		
		def moveAP = null
		if(unit.apRemaining > 0) {
			def forwardAP = this.getMoveAP(game, unit, true, jumping)
			def backwardAP = this.getMoveAP(game, unit, false, jumping)
			
			moveAP = [
				forward: forwardAP,
				backward: backwardAP
			]
		}
		
		def data = [
			unit: unit.id,
			moveAP: moveAP,
			jpMoved: unit.jpMoved,
			jumping: jumping,
			heat: unit.heat,
			jumpCapable: (unit.jumpPoints > 0 && (unit.apMoved == 0 || unit.jpMoved >= 0))
		]
		
		return data
	}
	
	/**
	 * Targets a unit, providing toHit for each weapon on the Unit against
	 * @param game
	 * @param unit
	 * @param target
	 * @return
	 */
	public def targetUnitInfo(Game game, BattleUnit unit, BattleUnit target) {
		if(unit != game.getTurnUnit()) return
		
		def weaponData = []
		def data = [
			target: target.id,
			weaponData: weaponData
		]
		
		if(unit instanceof BattleMech) {
			BattleWeapon[] weapons = unit.getWeapons()
			for(BattleWeapon w in weapons) {
				if(!w.isActive() || w.cooldown > 0) continue
				
				// if applicable, determine if there is enough ammo
				def ammoTypes = w.getAmmoTypes()
				if(ammoTypes != null && ammoTypes.size() > 0) {
					int ammoRemaining = 0
					
					// TODO: handle different ammo types within a weapon
					for(Ammo ammo in ammoTypes) {
						ammoRemaining = getRemainingAmmo(unit, ammo)
						if(ammoRemaining >= 0) {
							break
						}
					}
					
					if(ammoRemaining <= 0) {
						// skip this weapon target info since no ammo remaining
						continue
					}
				}
				
				// TODO: determine base toHit% based on Pilot skills
				// TODO: base melee to hit is from piloting skill
				//toHit = srcMech.getPilot().getPiloting();
				double toHit = 90.0
				def modifiers = WeaponModifier.getToHitModifiers(game, unit, w, target)
				for(WeaponModifier mod in modifiers) {
					toHit -= mod.getValue()
				}
				
				if(toHit > 100) toHit = 100
				
				if(toHit > 0) {
					def thisWeaponToHit = [
						weaponId: w.id,
						toHit: toHit
					]
					weaponData.add(thisWeaponToHit)
				}
			}
		}
		
		return data
	}
	
	
	/**
	 * Consumes the given ammo type and count, if possible
	 * @param unit
	 * @param ammoType
	 * @param ammoCount
	 * @return Integer the amount of ammo remaining, or -1 if no ammo could be consumed
	 */
	public int consumeAmmo(BattleUnit unit, Ammo ammoType, int ammoCount) {
		if(unit == null || ammoType == null) return -1
		
		int ammoRemaining = -1
		
		if(unit instanceof BattleMech) {
			for(int critSectionIndex in Mech.AMMO_CONSUME_LOCATIONS) {
				BattleEquipment[] thisCritSection = unit.getCritSection(critSectionIndex)
				
				for(BattleEquipment thisEquip in thisCritSection) {
					if(thisEquip instanceof BattleAmmo 
							&& thisEquip.isActive() 
							&& thisEquip.equipment.id == ammoType.id
							&& thisEquip.ammoRemaining > 0) {
						// found ammo
						if(ammoRemaining == -1) {
							ammoRemaining = 0
						}
						
						if(ammoCount > thisEquip.ammoRemaining) {
							ammoCount = thisEquip.ammoRemaining
						}
						
						if(ammoCount > 0) {
							thisEquip.ammoRemaining -= ammoCount
							thisEquip.save flush:true
							
							ammoCount = 0
						}
						
						ammoRemaining += thisEquip.ammoRemaining
					}
				}
			}
		}
		
		return ammoRemaining
	}
	
	/**
	 * Gets the ammo remaining of the given type
	 * @param unit
	 * @param ammoType
	 * @param ammoCount
	 * @return
	 */
	public int getRemainingAmmo(BattleUnit unit, Ammo ammoType) {
		if(unit == null || ammoType == null) return -1
		
		int ammoRemaining = 0

		if(unit instanceof BattleMech) {
			for(int critSectionIndex in Mech.AMMO_CONSUME_LOCATIONS) {
				BattleEquipment[] thisCritSection = unit.getCritSection(critSectionIndex)
				
				for(BattleEquipment thisEquip in thisCritSection) {
					if(thisEquip instanceof BattleAmmo
							&& thisEquip.isActive()
							&& thisEquip.equipment.id == ammoType.id
							&& thisEquip.ammoRemaining > 0) {
						// found ammo
						ammoRemaining += thisEquip.ammoRemaining
					}
				}
			}
		}
		
		return ammoRemaining
	}
	
	/**
	 * Fires a weapon at the target
	 * @param unit
	 * @param weapon
	 * @param target
	 * @return
	 */
	public def fireWeaponsAtUnit(Game game, BattleUnit unit, ArrayList weapons, BattleUnit target) {
		if(unit != game.getTurnUnit()) return
		else if(unit.shutdown) return
		
		if(unit.apRemaining == 0 && unit.actionPoints > 0) {
			// not enough action points to fire, but allow firing weapons when AP starts the round as zero due to MP reductions
			return new GameMessage("game.you.cannot.fire.ap.zero", null, null)
		}
		
		def data = [
			unit: unit.id,
			target: target.id
		]
		
		def unitWeapons = unit.getWeapons()
		
		// make sure each weapon is capable of being fired
		def firingWeapons = []
		for(BattleWeapon weapon in weapons) {
			// make sure the weapon is not destroyed
			if(!weapon.isActive()) continue
			// and is attached to the unit that is firing
			else if(!unitWeapons.contains(weapon)) continue
			// and make sure the weapon is not on cooldown still
			else if(weapon.cooldown > 0) continue
			
			if(weapon.isPhysical()) {
				// if a physical attack is being made, no other weapon attacks can be made this turn
				firingWeapons = [weapon]
				break;
			}
			else {
				firingWeapons.push(weapon)
			}
		}
		
		def critsHitList = []
		def pilotingSkillMap = [
			source: [],
			target: []
		]
		
		int totalHeat = 0
		
		for(BattleWeapon weapon in firingWeapons) {
			String messageCode
			Object[] messageArgs
			
			// if applicable, look for and consume ammo
			def ammoTypes = weapon.getAmmoTypes()
			if(ammoTypes != null && ammoTypes.size() > 0) {
				if(data.ammoRemaining == null) {
					data.ammoRemaining = [:]
				}
				
				int ammoRemaining = 0
				
				// TODO: handle different ammo types within a weapon
				for(Ammo ammo in ammoTypes) {
					ammoRemaining = consumeAmmo(unit, ammo, 1)
					if(ammoRemaining >= 0) {
						// return with data about ammo remaining in each ammo crit
						if(unit instanceof BattleMech) {
							BattleEquipment[] ammoEquipment = unit.getEquipmentFromBaseObject(ammo)
							for(BattleEquipment ammoEquip in ammoEquipment) {
								data.ammoRemaining[ammoEquip.id] = ammoEquip.ammoRemaining
							}
						}
						
						break
					}
				}
				
				if(ammoRemaining < 0) {
					// TODO: provide messaging just to the weapon owner and skip this weapon fire since no ammo remaining
					continue
				}
			}
			
			// TODO: determine base toHit% based on Pilot skills
			// TODO: base melee to hit is from piloting skill
			//toHit = srcMech.getPilot().getPiloting();
			double toHit = 90.0
			def modifiers = WeaponModifier.getToHitModifiers(game, unit, weapon, target)
			for(WeaponModifier mod in modifiers) {
				toHit -= mod.getValue()
			}
			
			if(toHit <= 0) {
				// TODO: if the target is destroyed, let it continue to be overkilled by remaining fire for less salvage
				// If the weapon cannot hit, do not bother firing it
				continue
			}
			
			// store data about this weapon fire results
			def thisWeaponFire = [weaponId: weapon.id]
			def thisWeaponData = [
				unit: unit.id,
				target: target.id,
				weaponFire: thisWeaponFire
			]
			
			// add the weapon heat
			totalHeat += weapon.getHeat()
			
			// set the weapon on cooldown
			weapon.cooldown = weapon.getCycle()
			thisWeaponFire.weaponCooldown = weapon.cooldown
			
			if(weapon.isPhysical()) {
				// apply cooldown to all other physical weapons
				for(String equipId in unit.physical) {
					BattleWeapon e = BattleWeapon.get(equipId)
					if(e != null) {
						e.cooldown = e.getCycle()
						e.save flush:true
					}
				}
			}
			
			boolean weaponHit = false
			if(toHit >= 100) {
				//log.info("Weapon "+weapon+" AUTO HIT ("+toHit+")!")
				weaponHit = true
			}
			else if(toHit > 0){
				int result = Roll.randomInt(100, 1)
				if(result <= toHit) {
					//log.info("Weapon "+weapon+" HIT! Rolled: "+result+"/"+toHit)
					weaponHit = true
				}
				else {
					//log.info("Weapon "+weapon+" MISSED! Rolled: "+result+"/"+toHit)
				}
			}
			
			if(weaponHit) {
				int damage = weapon.getDamage()
				int projectiles = weapon.getProjectiles()
				
				String locationStr = null
				String damageByLocationStr = null
				
				int numHits = 1
				if(projectiles > 1) {
					def clusterDieResult = Roll.rollD6(2)
					def clusterRow = CLUSTER_HITS[clusterDieResult]
					
					if(projectiles == 2){ numHits = clusterRow[0] }
					else if(projectiles == 4){ numHits = clusterRow[1] }
					else if(projectiles == 5){ numHits = clusterRow[2] }
					else if(projectiles == 6){ numHits = clusterRow[3] }
					else if(projectiles == 10){ numHits = clusterRow[4] }
					else if(projectiles == 15){ numHits = clusterRow[5] }
					else if(projectiles == 20){ numHits = clusterRow[6] }
				}
				
				// handle weapons with cluster hit locations
				int clusterHits = weapon.getClusterHits()
				
				for(int i=0; i<numHits; i+= clusterHits) {
					// determine amount of damage for this grouping
					int numThisGroup = clusterHits;
					if(clusterHits > 1 && clusterHits + i >= numHits){
						numThisGroup = numHits - i;
					}
					
					if(numThisGroup == 0){
						break;
					}
					
					int actualDamage = damage * numThisGroup
					
					// determine hit location based on relative position of the attack on the target
					int hitLocation = getHitLocation(game, unit, weapon, target)

					if(hitLocation >= 0) {
						thisWeaponFire.weaponHit = true
						if(thisWeaponFire.weaponHitLocations == null) {
							thisWeaponFire.weaponHitLocations = []
						}
						if(thisWeaponFire.weaponHitLocations[hitLocation] == null) {
							thisWeaponFire.weaponHitLocations[hitLocation] = 0
						}
						
						if(target instanceof BattleMech) {
							// handle any piloting skill checks that may need to happen after crits are hit from self damage
							def fireCritsHitList = applyDamage(game, actualDamage, target, hitLocation)
							critsHitList = (critsHitList << fireCritsHitList).flatten()
							
							thisWeaponFire.weaponHitLocations[hitLocation] += actualDamage
							
							if(locationStr == null || damageByLocationStr == null) {
								// set the message arguments of the hit result
								locationStr = Mech.getLocationText(hitLocation)
								damageByLocationStr = String.valueOf(actualDamage)
							}
							else {
								// append the message arguments of the hit result
								locationStr += ","+Mech.getLocationText(hitLocation)
								if(clusterHits > 1) {
									// only append the damage for cluster hit weapons due to different damage by grouping
									damageByLocationStr += ","+String.valueOf(actualDamage)
								}
							}
						}
					}
				}
				
				// TODO: Make flamer able to apply heat instead of damage to target
				
				if(weapon.isPhysical()) {
					if(weapon.isCharge()
							|| weapon.isDFA()) {
							
						// displace the target unit and move the attacking unit into its hex
						Coords targetLocation = target.getLocation()
						Coords displacedLocation = handleDisplacement(game, target, unit.heading)
						
						if(displacedLocation != null) {
							// attacker advances into the new hex
							
							// TODO: create new method which is similar to move() but more appropriate for Charge/DFA needs
							def moveData = move(game, unit, true, weapon.isDFA(), true)
							
							// TODO: do something with the returned move() data?
						}
						else {
							// no displacement occurs, attacker stays put
						}
						
						// attacker also takes damage after a Charge/DFA attack
						int attackerDamage = 0
						def selfHitLocations = null
						if(weapon.isCharge()) {
							// charging unit takes 1 point of damage for every 10 tons the defending unit weighs
							attackerDamage = (target instanceof BattleMech) ? Math.ceil(target.mech.mass / 10) : 0
							selfHitLocations = Mech.FRONT_HIT_LOCATIONS
							
							pilotingSkillMap.source.push(PilotingModifier.Modifier.MECH_CHARGE)
							pilotingSkillMap.target.push(PilotingModifier.Modifier.MECH_CHARGED)
						}
						else if(weapon.isDFA()) {
							// attacking unit takes 1 point of damage for every 5 tons the attacking unit weighs to the legs
							attackerDamage = (unit instanceof BattleMech) ? Math.ceil(unit.mech.mass / 5) : 0
							selfHitLocations = Mech.FRONT_KICK_LOCATIONS
							
							pilotingSkillMap.source.push(PilotingModifier.Modifier.MECH_DFA)
							pilotingSkillMap.target.push(PilotingModifier.Modifier.MECH_DFAD)
						}
						
						if(attackerDamage > 0 && selfHitLocations != null) {
							def selfData = selfDamage(game, attackerDamage, unit, selfHitLocations)
							
							if(selfData != null) {
								String selfAttackerDamage = String.valueOf(selfData.damage)
								String selfLocationStr = Mech.getLocationText(selfData.hitLocation)
								
								Object[] selfMessageArgs = [unit.toString(), selfAttackerDamage, weapon.getShortName(), selfLocationStr]
								Date update = addMessageUpdate(
										game,
										"game.unit.damage.self",
										selfMessageArgs, selfData)
							}
						}
					}
					else if(weapon.isKick()) {
						pilotingSkillMap.target.push(PilotingModifier.Modifier.MECH_KICKED)
					}
				}
				
				if(locationStr == null || damageByLocationStr == null) {
					// a hit can still be a miss if legs are rolled with partial cover
					weaponHit = false
					thisWeaponFire.weaponHit = false
				}
				else{
					messageCode = "game.weapon.hit"
					messageArgs = [unit.getPilotCallsign(), target.getPilotCallsign(), weapon.getShortName(), damageByLocationStr, locationStr]
				}
			}
			else if(weapon.isPhysical()) {
				if(weapon.isKick()) {
					// kick missed, perform a piloting skill roll
					pilotingSkillMap.source.push(PilotingModifier.Modifier.MECH_MISSED_KICK)
				}
				else if(weapon.isCharge()) {
					// charge missed, displace to another location
					Coords unitLocation = unit.getLocation()
					Hex origHex = game.getHexAt(unitLocation)
					
					int headingLeft = getRotateHeadingCCW(unit.heading)
					Coords displacedLeft = getForwardCoords(game, unitLocation, headingLeft)
					
					int headingRight = getRotateHeadingCW(unit.heading)
					Coords displacedRight = getForwardCoords(game, unitLocation, headingRight)
					
					// handle if the new displaced location cannot be entered, or if an existing unit is in that location
					int displacedHeading = -1
					if(displacedLeft.equals(unitLocation)){
						// left is not possible, use right
						displacedHeading = headingRight
					}
					else if(displacedRight.equals(unitLocation)){
						// right is not possible, use left
						displacedHeading = headingLeft
					}
					else{
						// randomly pick left or right
						boolean coinToss = (Roll.randomInt(2, 1) == 1)
						if(coinToss){
							displacedHeading = headingLeft
						}
						else{
							displacedHeading = headingRight
						}
					}
					
					if(displacedHeading != -1) {
						Coords displacedLocation = handleDisplacement(game, unit, displacedHeading)
					}
				}
				else if(weapon.isDFA()) {
					// DFA attack missed, the attacker falls automatically at its current position and takes falling damage
					pilotingSkillMap.source.push(PilotingModifier.Modifier.MECH_MISSED_DFA)
				}
			}
			
			// TODO: if a charging or DFA'ing mech takes damage before its next turn after performing the charge/DFA, it must make a piloting skill roll
			
			if(!weaponHit) {
				// set the message of the missed result
				messageCode = "game.weapon.missed"
				messageArgs = [unit.getPilotCallsign(), target.getPilotCallsign(), weapon.getShortName()]
			}
			
			weapon.save flush:true
			
			// Add update information only about this weapon being fired
			Date update = addMessageUpdate(game, messageCode, messageArgs, thisWeaponData)
		}
		
		// perform piloting check on source unit if certain attacks hit or missed
		checkActionsPilotSkill(game, unit, pilotingSkillMap.source)
		
		// perform piloting check on target unit if certain attacks hit
		checkActionsPilotSkill(game, target, pilotingSkillMap.target)
		
		// perform piloting check on target in case it has received 20 damage or more this turn and hasn't already performed the check
		checkDamageTakenPilotSkill(game, target)
		
		// perform piloting check on target if certain criticals received damage from weapons fire
		checkCriticalsHitPilotSkill(game, target, critsHitList)
		
		
		// update return data with target armor/internals
		// TODO: make the applyDamage method return hash of locations damaged instead of the entire armor/internals array
		data.armorHit = target.armor
		data.internalsHit = target.internals
		
		// apply the total weapon heat
		unit.heat += totalHeat
		data.heat = unit.heat
		
		// use an actionPoint only if it had AP to use
		if(unit.apRemaining > 0) {
			unit.apRemaining -= 1
		}
		data.apRemaining = unit.apRemaining
		
		unit.save flush:true
		target.save flush:true
		
		// Add data only update information about the unit and target
		Date update = addMessageUpdate(game, null, null, data)
		
		// automatically end the unit's turn after firing
		this.initializeNextTurn(game)
		
		// TODO: handle returning all of the individual data arrays instead of just the last
		return data
	}
	
	/**
	 * Developer use only
	 * @param game
	 * @param target
	 * @return
	 */
	public def devTripTarget(Game game, BattleUnit target) {
		if(!isRootUser()) return
		
		log.info("devTrip to "+target.toString())
		
		def modifiers = PilotingModifier.getPilotSkillModifiers(game, target, null)
			
		log.info("Modifiers for "+target.toString()+": "+modifiers)
		
		def checkSuccess = doPilotSkillCheck(game, target, modifiers)
		
		log.info("checkSuccess: "+checkSuccess)
	}
	
	/**
	 * Performs piloting checks for each action for skill checks provided in the pilotingActionsChecks list
	 */
	public def checkActionsPilotSkill(Game game, BattleUnit target, def pilotingActionsChecks) {
		if(target instanceof BattleMech) {
			for(PilotingModifier.Modifier thisCause in pilotingActionsChecks) {
				log.info("Pilot skill check due to: "+thisCause)
				
				def modifiers = PilotingModifier.getPilotSkillModifiers(game, target, thisCause)
				def checkSuccess = doPilotSkillCheck(game, target, modifiers)
				
				if(!checkSuccess) {
					// if a check fails, no subsequent pilot skill checks need to be made
					return checkSuccess
				}
			}
		}
		
		return true
	}
	
	/**
	 * Perform piloting check on target in the event it has received 20 damage or more this turn and hasn't already performed the check
	 */
	public def checkDamageTakenPilotSkill(Game game, BattleUnit target) {
		if(target instanceof BattleMech 
				&& target.damageTaken >= 20
				&& target.damageTakenCheck == false) {
				
			// piloting skill check for damage taken only happens once per unit turn
			target.damageTakenCheck = true
			
			def modifiers = PilotingModifier.getPilotSkillModifiers(game, target, PilotingModifier.Modifier.MECH_DAMAGE)
			
			def checkSuccess = doPilotSkillCheck(game, target, modifiers)
			return checkSuccess
		}
				
		return true
	}
	
	/**
	 * Perform piloting check on target in the event it has had a critical hit on a component that requires a pilot skill check to be performed
	 */
	public def checkCriticalsHitPilotSkill(Game game, BattleUnit target, def critsHitList) {
		if(target instanceof BattleMech 
				&& critsHitList != null 
				&& critsHitList.size() > 0) {
			
			for(def thisHit in critsHitList) {
				PilotingModifier.Modifier thisCause = null
				
				if(thisHit instanceof Integer) {
					// a mech location was blown off entirely, if it was a leg a piloting skill check is needed
					if(Mech.LEFT_LEG == thisHit || Mech.RIGHT_LEG == thisHit) {
						thisCause = PilotingModifier.Modifier.LEG_DESTROYED
					}
				}
				else if(thisHit instanceof BattleEquipment) {
					// only certain criticals that are hit require a piloting skill roll to be made
					if(MechMTF.MTF_CRIT_GYRO == thisHit.getName()) {
						// TODO: fix Gyro thinking it is one crit when it is multiple for one object instance
						thisCause = thisHit.isDestroyed() 
							? PilotingModifier.Modifier.GYRO_DESTROYED : PilotingModifier.Modifier.GYRO_HIT
					}
					else if(MechMTF.MTF_CRIT_UP_LEG_ACT == thisHit.getName() && thisHit.isDestroyed()) {
						thisCause = PilotingModifier.Modifier.UP_LEG_ACTUATOR_DESTROYED
					}
					else if(MechMTF.MTF_CRIT_LOW_LEG_ACT == thisHit.getName() && thisHit.isDestroyed()) {
						thisCause = PilotingModifier.Modifier.LOW_LEG_ACTUATOR_DESTROYED
					}
					else if(MechMTF.MTF_CRIT_FOOT_ACT == thisHit.getName() && thisHit.isDestroyed()) {
						thisCause = PilotingModifier.Modifier.FT_ACTUATOR_DESTROYED
					}
					else if(MechMTF.MTF_CRIT_HIP == thisHit.getName() && thisHit.isDestroyed()) {
						thisCause = PilotingModifier.Modifier.HIP_DESTROYED
					}
				}
				
				if(thisCause != null) {
					log.info("Pilot skill check due to critical on: "+thisHit)
					
					def modifiers = PilotingModifier.getPilotSkillModifiers(game, target, thisCause)
					def checkSuccess = doPilotSkillCheck(game, target, modifiers)
					
					if(!checkSuccess) {
						// if a check fails, no subsequent pilot skill checks need to be made
						return checkSuccess
					}
				}
			}
		}
				
		return true
	}
	
	/**
	 * Perform piloting check on unit if anything performed during its turn requires a piloting skill check only at the end of the turn
	 * @param game
	 * @param unit
	 * @return
	 */
	public def checkEndTurnPilotSkill(Game game, BattleUnit unit) {
		if(unit instanceof BattleMech) {
			PilotingModifier.Modifier pilotingCheckModifier = null
			
			CombatStatus turnUnitStatus = getUnitCombatStatus(game, unit)
			if(turnUnitStatus == CombatStatus.UNIT_JUMPING) {
				// jumping will require a piloting skill check with destroyed leg, or damaged gyro, leg/foot/hip actuators
				if(unit.isLegged()) {
					log.info("Pilot skill check due to jumping with destroyed leg")
					pilotingCheckModifier = PilotingModifier.Modifier.MECH_JUMPING
				}
				else {
					def mtfNamesList = [MechMTF.MTF_CRIT_GYRO, MechMTF.MTF_CRIT_HIP,
							MechMTF.MTF_CRIT_UP_LEG_ACT, MechMTF.MTF_CRIT_LOW_LEG_ACT, MechMTF.MTF_CRIT_FOOT_ACT]
					def critsList = unit.getEquipmentFromMTFNames(mtfNamesList)
					
					for(BattleEquipment critEquip in critsList) {
						
						if(!critEquip.isActive()) {
							log.info("Pilot skill check due to jumping with critical on: "+critEquip)
							pilotingCheckModifier = PilotingModifier.Modifier.MECH_JUMPING
							break;
						}
					}
				}
			}
			else if(turnUnitStatus == CombatStatus.UNIT_RUNNING) {
				// running will require a piloting skill check with damaged hip or gyro
				def mtfNamesList = [MechMTF.MTF_CRIT_GYRO, MechMTF.MTF_CRIT_HIP]
				def critsList = unit.getEquipmentFromMTFNames(mtfNamesList)
				
				for(BattleEquipment critEquip in critsList) {
					
					if(!critEquip.isActive()) {
						log.info("Pilot skill check due to running with critical on: "+critEquip)
						pilotingCheckModifier = PilotingModifier.Modifier.MECH_RUNNING
						break;
					}
				}
				
			}
			
			if(pilotingCheckModifier != null) {
				def modifiers = PilotingModifier.getPilotSkillModifiers(game, unit, pilotingCheckModifier)
				def checkSuccess = doPilotSkillCheck(game, unit, modifiers)
				
				return checkSuccess
			}
		}
		
		return true
	}
	
	/**
	 * Does the piloting skill check for the unit based on the given modifiers, and if fails makes the unit fall
	 */
	public def doPilotSkillCheck(Game game, BattleUnit unit, def modifiers) {
		if(!unit instanceof BattleMech) {
			return true
		}
		
		// TODO: determine base toHit% based on Pilot skills
		double toCheck = 90.0
		boolean attemptingStanding = false
		
		// TODO: perform pilot skill check to stand when attempting to move (but not rotate) while prone
		
		for(PilotingModifier mod in modifiers) {
			toCheck -= mod.getValue()
			
			if(mod.getValue() == 0 && PilotingModifier.Modifier.MECH_STANDING == mod.type) {
				attemptingStanding = true
			}
		}
		
		if(unit.prone && !attemptingStanding) {
			// if already prone, only reason to roll pilot skill is to try to stand up
			return false
		}
		
		boolean checkSuccess = false
		if(toCheck >= 100) {
			log.info("Unit "+unit+" AUTO STANDS ("+toCheck+")!")
			checkSuccess = true
		}
		else if(toCheck > 0){
			int result = Roll.randomInt(100, 1)
			if(result <= toCheck) {
				log.info("Unit "+unit+" STANDS! Rolled: "+result+"/"+toCheck)
				checkSuccess = true
			}
			else {
				log.info("Unit "+unit+" FALLS! Rolled: "+result+"/"+toCheck)
			}
		}
		else {
			log.info("Unit "+unit+" AUTO FALLS ("+toCheck+")!")
		}
		
		if(checkSuccess 
				&& attemptingStanding) {
			// the prone unit stands on its own again
			unit.prone = false
			
			// add message about standing up again
			def selfData = [
				unit: unit.id,
				prone: unit.prone
			]
			
			Object[] selfMessageArgs = [unit.toString()]
			Date update = addMessageUpdate(
					game,
					"game.unit.stands",
					selfMessageArgs, selfData)
		}
		else if(!checkSuccess) {
			// Unit falls and takes damage
			unit.prone = true
			
			// fall damage is 1 point of damage for evey 10 tons of weight, rounding up, time the number of levels fallen
			int fallDamage = Math.ceil(unit.mech.mass / 10)	// TODO: calculate fall damage based on falling multiple elevations levels
			
			// determine fall hit locations based on new facing after fall
			def fallHitLocations
			def dieResult = Roll.rollD6(1)
			def headingAdd = dieResult - 1
			unit.heading = (unit.heading + headingAdd) % 6;
			
			def fallSideStr = "unknown"	// TODO: i18n the fallen side string
			switch(dieResult) {
				case 1:	fallHitLocations = Mech.FRONT_HIT_LOCATIONS
						fallSideStr = "front"
						break;
				case 2:	fallHitLocations = Mech.RIGHT_HIT_LOCATIONS
						fallSideStr = "right"
						break;
				case 3:	fallHitLocations = Mech.RIGHT_HIT_LOCATIONS
						fallSideStr = "right"
						break;
				case 4:	fallHitLocations = Mech.REAR_HIT_LOCATIONS
						fallSideStr = "rear"
						break;
				case 5:	fallHitLocations = Mech.LEFT_HIT_LOCATIONS
						fallSideStr = "left"
						break;
				case 6:	fallHitLocations = Mech.LEFT_HIT_LOCATIONS
						fallSideStr = "left"
						break;
						
				default:break;
			}
			
			def fallData = [
				unit: unit.id,
				heading: unit.heading,
				prone: unit.prone
			]
			
			if(unit.jpMoved >= 0) {
				// unit was jumping but is now prone
				fallData.jumping = false
			}
			
			Object[] fallMessageArgs = [unit.toString(), fallSideStr]
			Date fallUpdate = addMessageUpdate(
					game,
					"game.unit.falls",
					fallMessageArgs, fallData)
			
			// apply damage in groupings of 5
			while(fallDamage > 0) {
				def thisDamage = 5
				if(fallDamage < thisDamage) {
					thisDamage = fallDamage
				}
				
				def selfData = selfDamage(game, thisDamage, unit, fallHitLocations)
				
				if(selfData != null) {
					String selfAttackerDamage = String.valueOf(thisDamage)
					String selfLocationStr = Mech.getLocationText(selfData.hitLocation)
					
					Object[] selfMessageArgs = [unit.toString(), selfAttackerDamage, "FALLING", selfLocationStr]	//TODO: i18n FALLING?
					Date update = addMessageUpdate(
							game,
							"game.unit.damage.self",
							selfMessageArgs, selfData)
				}
				
				fallDamage -= 5
			}
		}
		
		unit.save flush:true
		
		return checkSuccess
	}
	

	/**
	 * performs the roll to determine the hit location taking into account the orientation of the target
	 * @param game
	 * @param srcUnit
	 * @param weapon
	 * @param tgtUnit
	 * @return
	 */
	public int getHitLocation(Game game, BattleUnit srcUnit, BattleWeapon weapon, BattleUnit tgtUnit){
	
		// account for the orientation of the target
		// if(tgtUnit instanceof BattleMech)...
		def unitLocations = Mech.FRONT_HIT_LOCATIONS
		
		// Melee weapons have different hit locations
		def isHatchet = weapon.isHatchet()
		def isPunch = weapon.isPunch()
		def isKick = weapon.isKick()
		def isCharge = weapon.isCharge()
		def isDFA = weapon.isDFA()
		
		Coords srcLocation = srcUnit.getLocation()
		Coords tgtLocation = tgtUnit.getLocation()
		
		// account for punch/kick/hatchet hit location when target is different elevation
		def srcHex = game.getHexAt(srcLocation)
		def tgtHex = game.getHexAt(tgtLocation)
		def elevationDiff = srcHex.elevation - tgtHex.elevation
		
		// use punch locations for punching at same elevation, or when above target by one elevation level for kick/hatchet
		boolean usePunchLocations = ((isPunch && elevationDiff == 0)
				|| (isKick && elevationDiff == 1)
				|| (isHatchet && elevationDiff == 1))
		
		
		// use kick locations for kicking at same elevation, or when below target by one elevation level for punch/hatchet
		boolean useKickLocations = ((isKick && elevationDiff == 0)
				|| (isPunch && elevationDiff == -1)
				|| (isHatchet && elevationDiff == -1))
		
		
		// find out if the target has partial cover as it could effect the resulting hit location
		def targetHasCover = false;
		if(isCharge || isDFA) {
			// partial cover does not apply against charge or DFA attacks
		}
		else{
			def fromLocationMods = WeaponModifier.getToHitModifiersFromLocation(game, srcUnit, tgtUnit)
			for(int i=0; i<fromLocationMods.size(); i++) {
				def modifier = fromLocationMods[i]
				if(modifier != null
						&& modifier.getType() == WeaponModifier.Modifier.PARTIAL_COVER
						&& modifier.getValue() > 0) {
					
					targetHasCover = true
				}
			}
		}
		
		def fromDirection = tgtLocation.direction(srcLocation)
		def targetDirection = tgtUnit.heading
		
		def diff = Math.abs(fromDirection - targetDirection)
		
		if(diff == 3) {
			// target is facing directly away from the source
			//debug.log(srcUnit.variant+" on rear side of "+tgtUnit.variant);
			if(usePunchLocations){
				unitLocations = Mech.REAR_PUNCH_LOCATIONS
			}
			else if(useKickLocations){
				unitLocations = Mech.REAR_KICK_LOCATIONS
			}
			else{
				unitLocations = Mech.REAR_HIT_LOCATIONS
			}
		}
		else if((diff == 2 && fromDirection > targetDirection)
					|| (diff == 4 && fromDirection < targetDirection)) {
			// target is on the right flank
			//debug.log(srcUnit.variant+" on right flank of "+tgtUnit.variant);
			if(usePunchLocations){
				unitLocations = Mech.RIGHT_PUNCH_LOCATIONS
			}
			else if(useKickLocations){
				unitLocations = Mech.RIGHT_KICK_LOCATIONS
			}
			else{
				unitLocations = Mech.RIGHT_HIT_LOCATIONS
			}
		}
		else if((diff == 2 && fromDirection < targetDirection)
					|| (diff == 4 && fromDirection > targetDirection)) {
			// target is on the left flank
			//debug.log(srcUnit.variant+" on left flank of "+tgtUnit.variant);
			if(usePunchLocations){
				unitLocations = Mech.LEFT_PUNCH_LOCATIONS
			}
			else if(useKickLocations){
				unitLocations = Mech.LEFT_KICK_LOCATIONS
			}
			else{
				unitLocations = Mech.LEFT_HIT_LOCATIONS
			}
		}
		else {
			//debug.log(srcUnit.variant+" on front side of "+tgtUnit.variant);
			if(usePunchLocations) {
				unitLocations = Mech.FRONT_PUNCH_LOCATIONS
			}
			else if(useKickLocations) {
				unitLocations = Mech.FRONT_KICK_LOCATIONS
			}
			else {
				unitLocations = Mech.FRONT_HIT_LOCATIONS
			}
		}
		
		if(unitLocations.size() == 6) {
			// punch and kick locations are 1d6 rolls
			def dieResult = Roll.rollD6(1)
			def resultLocation = dieResult - 1
			
			// normal locations array starts at where the 1 is rolled
			return unitLocations[resultLocation]
		}
		else {
			def dieResult = Roll.rollD6(2)
			def resultLocation = dieResult - 2
			//debug.log("dieResult: "+dieResult);
			
			if(targetHasCover &&
					(resultLocation == Mech.LEFT_LEG
					|| resultLocation == Mech.RIGHT_LEG)) {
				// account for partial cover when roll to hit legs it does not hit the mech, rather the ground in front of it
				return -1
			}
			
			// normal locations array starts at where the 2 is rolled
			return unitLocations[resultLocation]
		}
	}
	
	// apply damage to hit location starting with armor, then internal, then use damage redirect from there if needed
	public def applyDamage(Game game, int damage, BattleUnit unit, int hitLocation) {
		def critsHitList = []
		
		if(unit.isDestroyed()) {
			// allow overkill damage since it means less salvage 
			//return critsHitList
		}
		
		//log.info("Applying "+damage+" damage to "+unit+" @ "+Mech.getLocationText(hitLocation))
		
		// if(unit instanceof BattleMech)...
		while(damage > 0 && unit.armor[hitLocation] > 0) {
			unit.armor[hitLocation] --
			damage --
			
			unit.damageTaken ++
		}
		
		if(damage == 0) {
			// no damage remaining after hitting external armor, no need to go further
			return critsHitList
		}
		
		// rear hit locations hit internals at a different location index corresponding to their front counterpart
		def critLocation = hitLocation
		if(hitLocation == Mech.LEFT_REAR) {
			critLocation = Mech.LEFT_TORSO
		}
		else if(hitLocation == Mech.RIGHT_REAR) {
			critLocation = Mech.RIGHT_TORSO
		}
		else if(hitLocation == Mech.CENTER_REAR) {
			critLocation = Mech.CENTER_TORSO
		}
	
		boolean critChance = false
		boolean critLocationDestroyed = false
		while(damage > 0 && unit.internals[critLocation] > 0) {
			unit.internals[critLocation] --
			damage --
			
			critChance = true
			
			unit.damageTaken ++
			
			// check to see if the limb was just removed, if so add to critsHitList
			if(unit.internals[critLocation] == 0) {
				critLocationDestroyed = true
			}
		}
		
		if(critLocationDestroyed) {
			// destroy the location and set equipment in the location as damaged or destroyed
			def critsApplied = destroyLocation(game, unit, critLocation)
			critsHitList = (critsHitList << critsApplied).flatten()
		}
		
		if(critChance) {
			// send off to see what criticals might get hit
			def critsApplied = applyCriticalHit(game, unit, critLocation);
			
			if(critsApplied.size() > 0) {
				critsHitList = (critsHitList << critsApplied).flatten()
				
				// check for any potentially unit destroying crits that may have been made
				if(unit instanceof BattleMech){
					
					def numEngineHits = 0
					def numGyroHits = 0
					
					for(int i=0; i<unit.crits.size(); i++) {
						def thisCrit = unit.getEquipmentAt(i)
						if(thisCrit != null && !thisCrit.isActive()) {
							if(MechMTF.MTF_CRIT_COCKPIT == thisCrit.getName()) {
								// if the cockpit is destroyed, the unit is dead
								unit.status = BattleUnit.STATUS_DESTROYED
								
								// create destroyed message info
								def destroyedUnitData = [
									unit: unit.id,
									status: String.valueOf(unit.status)
								]
								
								Object[] messageArgs = [unit.toString()]
								Date update = addMessageUpdate(game, "game.unit.destroyed.cockpit", messageArgs, destroyedUnitData)
								
								return critsHitList
							}
							else if(MechMTF.MTF_CRIT_ENGINE == thisCrit.getName()
									|| MechMTF.MTF_CRIT_FUSION_ENGINE == thisCrit.getName()) {
								// if the Engine takes 3 or more hits, the unit is dead
								numEngineHits ++
							}
							else if(MechMTF.MTF_CRIT_GYRO == thisCrit.getName()) {
								// if the Gyro takes 2 hits, the unit is dead
								numGyroHits ++
							}
						}
					}
					
					if(numEngineHits >= 3) {
						unit.status = BattleUnit.STATUS_DESTROYED
						
						// create destroyed message info
						def destroyedUnitData = [
							unit: unit.id,
							status: String.valueOf(unit.status)
						]
						
						Object[] messageArgs = [unit.toString()]
						Date update = addMessageUpdate(game, "game.unit.destroyed.engine", messageArgs, destroyedUnitData)
						
						return critsHitList
					}
					else if(numGyroHits >= 2) {
						unit.status = BattleUnit.STATUS_DESTROYED
						
						// create destroyed message info
						def destroyedUnitData = [
							unit: unit.id,
							status: String.valueOf(unit.status)
						]
						
						Object[] messageArgs = [unit.toString()]
						Date update = addMessageUpdate(game, "game.unit.destroyed.gyro", messageArgs, destroyedUnitData)
						
						return critsHitList
					}
				}
			}
		}
		
		if(critLocationDestroyed && critLocation == Mech.HEAD) {
			// if head or center internal are gone, the unit is dead
			//debug.log("Head internal destroyed!");
			unit.status = BattleUnit.STATUS_DESTROYED
			
			// create destroyed message info
			def destroyedUnitData = [
				unit: unit.id,
				status: String.valueOf(unit.status)
			]
			
			Object[] messageArgs = [unit.toString()]
			Date update = addMessageUpdate(game, "game.unit.destroyed.head", messageArgs, destroyedUnitData)
			
			return critsHitList
		}
		else if(critLocationDestroyed && critLocation == Mech.CENTER_TORSO) {
			// if head or center internal are gone, the unit is dead
			//debug.log("CT internal destroyed!");
			unit.status = BattleUnit.STATUS_DESTROYED
			
			// create destroyed message info
			def destroyedUnitData = [
				unit: unit.id,
				status: String.valueOf(unit.status)
			]
			
			Object[] messageArgs = [unit.toString()]
			Date update = addMessageUpdate(game, "game.unit.destroyed.torso", messageArgs, destroyedUnitData)
			
			return critsHitList
		}
		else if(critLocationDestroyed && (critLocation == Mech.LEFT_LEG || critLocation == Mech.RIGHT_LEG) 
				&& unit.internals[Mech.LEFT_LEG] == 0 && unit.internals[Mech.RIGHT_LEG] == 0) {
			// if both of the legs internal are gone, the unit is dead
			//debug.log("Both legs destroyed!");
			unit.status = BattleUnit.STATUS_DESTROYED
			
			// create destroyed message info
			def destroyedUnitData = [
				unit: unit.id,
				status: String.valueOf(unit.status)
			]
			
			Object[] messageArgs = [unit.toString()]
			Date update = addMessageUpdate(game, "game.unit.destroyed.legs", messageArgs, destroyedUnitData)
			
			return critsHitList
		}
		
		if(critLocationDestroyed && critLocation ==  Mech.LEFT_TORSO) {
			// the LEFT_ARM and REAR needs to be gone if the torso is gone
			def critsApplied = destroyLocation(game, unit, Mech.LEFT_ARM)
			critsHitList = (critsHitList << critsApplied).flatten()
		}
		
		if(critLocationDestroyed && critLocation == Mech.RIGHT_TORSO) {
			// the RIGHT_ARM and REAR needs to be gone if the torso is gone
			def critsApplied = destroyLocation(game, unit, Mech.RIGHT_ARM)
			critsHitList = (critsHitList << critsApplied).flatten()
		}
		
		// TODO: update any destroyed weapons in locations with no remaining internal armor
		//updateDestroyedWeapons(unit);
		
		// any damage remaining after internals needs spread to other parts unless it was the Head or Center Torso (in which case the unit was already pronounced dead)
		if(damage == 0 || unit.isDestroyed()) {
			return critsHitList
		}
		else if(hitLocation == Mech.LEFT_ARM || hitLocation == Mech.LEFT_LEG || hitLocation == Mech.LEFT_REAR) {
			return applyDamage(game, damage, unit, Mech.LEFT_TORSO)
		}
		else if(hitLocation == Mech.RIGHT_ARM || hitLocation == Mech.RIGHT_LEG || hitLocation == Mech.RIGHT_REAR) {
			return applyDamage(game, damage, unit, Mech.RIGHT_TORSO)
		}
		else if(hitLocation == Mech.LEFT_TORSO || hitLocation == Mech.RIGHT_TORSO) {
			return applyDamage(game, damage, unit, Mech.CENTER_TORSO)
		}
		else {
			log.error("Who the hell did I hit?  Extra "+damage+" damage from location: "+hitLocation)
			return critsHitList
		}
	}
	
	private boolean isLocationDestroyed(BattleUnit unit, int location) {
		if(unit instanceof BattleMech) {
			return (unit.internals[location] == 0)
		}
		else{
			log.debug("BattleUnit instance "+unit+" unable to have location "+location)
		}
		
		return false
	}
	
	/**
	 * Sets the location's internal armor to zero and damages/destroys equipment in the location
	 * @param unit
	 * @param hitLocation
	 * @return list of damaged equipment and location indices that were destroyed
	 */
	private def destroyLocation(Game game, BattleUnit unit, int hitLocation) {
		def critsHitList = []
		
		if(unit instanceof BattleMech) {
			unit.internals[hitLocation] = 0
			
			critsHitList.push(hitLocation)
			
			BattleEquipment[] critSection = unit.getCritSection(hitLocation)
			for(BattleEquipment critEquip in critSection) {
				if(critEquip.isEmpty()) {
					continue
				}
				else if(critEquip.isActive()) {
					critEquip.status = BattleEquipment.STATUS_DAMAGED
					critEquip.save flush:true
					
					critsHitList.push(critEquip)
					
					// include data in the message for the damaged/destroyed equipment
					def criticalHitData = [id: critEquip.id, status: String.valueOf(critEquip.status)]
					def data = [target: unit.id, criticalHit: criticalHitData]
					
					Date update = addMessageUpdate(game, null, null, data)
				}
			}
		}
		else{
			log.debug("BattleUnit instance "+unit+" unable to have location "+hitLocation+" destroyed")
		}
		
		return critsHitList
	}
	
	/**
	 * Rolls to see if a critical hit will occur when the hitLocation has been damaged internally, and applies the result
	 */
	public def applyCriticalHit(Game game, BattleUnit unit, int hitLocation) {
		return applyCriticalHit(game, unit, hitLocation, 0)
	}
	
	/**
	 * Rolls to see if a critical hit will occur when the hitLocation has been damaged internally, and applies the result
	 * @return def list of critical hit equipment or location index of blown off limb
	 */
	public def applyCriticalHit(Game game, BattleUnit unit, int hitLocation, int numHits) {
		// store and return any crit equipment that gets hit
		def critsHitList = []
		
		if(unit.isDestroyed()) {
			// allow overkill damage since it means less salvage 
			//return critsHitList
		}
		
		def dieResult = Roll.rollD6(2)
		def locationStr = Mech.getLocationText(hitLocation)
		
		if(numHits == 0) {
			if(dieResult >= 12) {
				// 3 critical hits, or Head/Limb blown off
				numHits = 3
				
				if(hitLocation == Mech.HEAD || hitLocation == Mech.LEFT_ARM || hitLocation == Mech.RIGHT_ARM 
						|| hitLocation == Mech.LEFT_LEG || hitLocation == Mech.RIGHT_LEG) {
					// limb blown off!
					def critsApplied = destroyLocation(game, unit, hitLocation)
					critsHitList = (critsHitList << critsApplied).flatten()
					
					// TODO: include data in the update for the lost limb
					def data = [:]
					Object[] messageArgs = [unit.toString(), locationStr]
					Date update = addMessageUpdate(game, "game.unit.critical.limb", messageArgs, data)
					
					return [hitLocation]
				}
			}
			else if(dieResult >= 10) {
				// 2 critical hits
				numHits = 2
			}
			else if(dieResult >= 8) {
				// 1 critical hit
				numHits = 1
			}
			else {
				//log.info("No critical hits on "+hitLocation)
				return critsHitList
			}
		}
		
		// determine number of critical spaces that can still be hit
		def availableCrits = [:]
		BattleEquipment[] critSection
		
		// store any ammo equipment that gets hit to apply explosion damage
		def ammoHits = []
		
		if(unit instanceof BattleMech) {
			critSection = unit.getCritSection(hitLocation)
		}
		
		if(critSection == null) {
			log.error("No crit section "+hitLocation+" for unit "+unit)
			return critsHitList
		}
		else {
			// generate array of indices that can be critted so the roll only needs to be based on those that remain
			def critIndex = 0
			String prevEquipId = ""
			
			for(def i = 0; i < critSection.length; i ++){
				BattleEquipment thisEquip = critSection[i]
				
				if(prevEquipId.equals(thisEquip.id)) {
					critIndex ++
				}
				else {
					critIndex = 0
					prevEquipId = thisEquip.id
				}
				
				if(thisEquip.isEmpty()) {
					continue
				}
				else if(thisEquip.isActive()) {
					// equipment is active and has no crit damage
					availableCrits.put(i, [thisEquip: thisEquip, critIndex: critIndex])
				}
				else if(thisEquip.isDamaged()) {
					// equipment is damaged and may have some crits available to damage further
					if(thisEquip.criticalHits.length > 0
							&& thisEquip.criticalHits[critIndex] != true) {
						// TODO: handle equipment whose crits span more than one section
						availableCrits.put(i, [thisEquip: thisEquip, critIndex: critIndex])
					}
				}
			}
		}
		
		def numCrits = availableCrits.size()
		
		if(numCrits == 0) {
			// TODO: apply critical hits to next location according to damage transfer
			log.info("No Critical hits remain on "+hitLocation+" for unit "+unit)
		}
		else {
			if(numHits > numCrits) {
				numHits = numCrits
			}
			
			// roll for each hit to see what component is destroyed/damaged
			def availableCritKeys = availableCrits.keySet().toArray()
			def availableCritValues = availableCrits.values().toArray()
			
			for(def n = 0; n < numHits; n++) {
				def dieCrit = Roll.randomInt(numCrits, 1)
				def critHitKey = availableCritKeys[dieCrit - 1]
				def critHit = availableCritValues[dieCrit - 1]
				
				// remove key and regenerated the values/keys arrays
				availableCrits.remove(critHitKey)
				availableCritKeys = availableCrits.keySet().toArray()
				availableCritValues = availableCrits.values().toArray()
				
				BattleEquipment critEquip = critHit.thisEquip
				def critIndex = critHit.critIndex
				
				def numEquipCrits = critEquip.getCrits()
				
				if(critEquip.isActive()) {
					// apply destroyed or damaged status and create the criticalHits array to keep track of how many hits on the equipment
					critEquip.status = (numEquipCrits == 1) ? BattleEquipment.STATUS_DESTROYED : BattleEquipment.STATUS_DAMAGED
					
					if(critEquip.status == BattleEquipment.STATUS_DAMAGED) {
						critEquip.criticalHits = new Boolean[numEquipCrits]
						for(def i=0; i < numEquipCrits; i++) {
							critEquip.criticalHits[i] = (i == critIndex) ? true : false
						}
					}
				}
				else {
					critEquip.criticalHits[critIndex] = true
					
					// check to see if all critical hits are filled, and if so set status as destroyed
					boolean isDestroyed = true
					for(def checkValue in critEquip.criticalHits) {
						if(checkValue == false) {
							isDestroyed = false
							break
						}
					}
					
					if(isDestroyed) {
						critEquip.status = BattleEquipment.STATUS_DESTROYED
					}
				}
				
				if(critEquip instanceof BattleAmmo
						&& critEquip.ammoRemaining > 0) {
					// ammo that needs to be exploded and reduced to zero ammo will occur outside this loop
					ammoHits.add(critEquip)
				}
				
				critEquip.save flush:true
				
				critsHitList.push(critEquip)
				
				// include data in the message for the damaged/destroyed equipment
				def criticalHitData = [id: critEquip.id, status: String.valueOf(critEquip.status)]
				def data = [target: unit.id, criticalHit: criticalHitData]
				
				Object[] messageArgs = [unit.toString(), critEquip.toString(), locationStr]
				Date update = addMessageUpdate(game, "game.unit.critical.hit", messageArgs, data)
				
				numCrits --
			}
		}
		
		if(ammoHits.size() > 0) {
			for(BattleAmmo bAmmo in ammoHits) {
				if(bAmmo.isExplosive()) {
					int ammoRemaining = bAmmo.ammoRemaining
					int ammoExplosionDamage = ammoRemaining * bAmmo.getExplosiveDamage()
					
					def ammoCritsHitList = applyDamage(game, ammoExplosionDamage, unit, hitLocation)
					unit.save flush:true
					
					critsHitList = (critsHitList << ammoCritsHitList).flatten()
					
					// TODO: make the applyDamage method return hash of locations damaged instead of the entire armor/internals array
					def data = [
						unit: unit.id,
						target: unit.id,
						ammoExploded: bAmmo.id,
						damage: ammoExplosionDamage,
						hitLocation: hitLocation,
						armorHit: unit.armor,
						internalsHit: unit.internals
					]
					
					Object[] messageArgs = [unit.toString(), String.valueOf(ammoExplosionDamage), locationStr]
					Date update = addMessageUpdate(game, "game.unit.ammo.explosion", messageArgs, data)
				}
				
				bAmmo.ammoRemaining = 0
				bAmmo.save flush:true
			}
		}
		
		return critsHitList
	}
	
	/**
	 * Applies self damage to a randomly chosen location from the given set of hitLocations, as a result of this unit falling, charging, or DFA'ing 
	 * @param damage
	 * @param unit
	 * @param hitLocations
	 * @return
	 */
	public def selfDamage(Game game, int damage, BattleUnit unit, def unitLocations) {
		if(unit.isDestroyed()) return
		
		int hitLocation = -1
		if(unitLocations.size() == 6) {
			// punch and kick locations are 1d6 rolls
			def dieResult = Roll.rollD6(1)
			def resultLocation = dieResult - 1
			
			// normal locations array starts at where the 1 is rolled
			hitLocation = unitLocations[resultLocation]
		}
		else {
			def dieResult = Roll.rollD6(2)
			def resultLocation = dieResult - 2
			//debug.log("dieResult: "+dieResult);
			
			// normal locations array starts at where the 2 is rolled
			hitLocation = unitLocations[resultLocation]
		}
		
		def critsHitList = applyDamage(game, damage, unit, hitLocation)
		
		// handle any piloting skill checks that may need to happen after crits are hit from self damage
		checkCriticalsHitPilotSkill(game, unit, critsHitList)
		
		unit.save flush:true
		
		// TODO: make the applyDamage method return hash of locations damaged instead of the entire armor/internals array
		def data = [
			unit: unit.id,
			target: unit.id,
			damage: damage,
			hitLocation: hitLocation,
			armorHit: unit.armor,
			internalsHit: unit.internals
		]
		
		return data
	}
	
	/**
	 * Checks to see if the location being jumped to can be performed with respect to elevation
	 * @param game
	 * @param currentCoords
	 * @param newCoords
	 * @return the JP required (-1 if not possible)
	 */
	public static int getHexRequiredJP(Game game, Coords currentCoords, Coords newCoords) {
		int jpRequired = 1
		
		Hex currentHex = game.board?.getHexAt(currentCoords.x, currentCoords.y)
		Hex newHex = game.board?.getHexAt(newCoords.x, newCoords.y)
		
		if(currentHex == null || newHex == null) {
			return -1
		}
		
		int currentElevation = currentHex.elevation
		int newElevation = newHex.elevation
		
		int elevDiff = Math.abs(newElevation - currentElevation)
		
		if(elevDiff > 1) {
			jpRequired += (elevDiff - 1)
		}
		
		return jpRequired
	}
	
	/**
	 * checks to see if the location being moved to can be done with respect to elevation and impedance
	 * also the currentXY needs to be adjacent, otherwise it will not mean much
	 * @param game
	 * @param currentCoords
	 * @param newCoords
	 * @return the AP required (-1 if not possible)
	 */
	public static int getHexRequiredAP(Game game, Coords currentCoords, Coords newCoords) {
		int apRequired = 1
		
		Hex currentHex = game.board?.getHexAt(currentCoords.x, currentCoords.y)
		Hex newHex = game.board?.getHexAt(newCoords.x, newCoords.y)
		
		if(currentHex == null || newHex == null
				|| (currentHex.x == newHex.x && currentHex.y == newHex.y)) {
			return -1
		}
		
		int currentElevation = currentHex.elevation
		int newElevation = newHex.elevation
		
		int elevDiff = Math.abs(newElevation - currentElevation)
		if(elevDiff > 2){
			// no more than 2 elevation changes can occur
			return -1
		}
		
		// add the cost of elevation differences
		apRequired += elevDiff
		
		// add the cost of terrain movement
		int terrainAP = newHex.getMovementCost()
		apRequired += terrainAP
		
		int newWaterLevel = newHex.getTerrainLevel(Terrain.WATER)
		int currentWaterLevel = currentHex.getTerrainLevel(Terrain.WATER)
		if(newWaterLevel >= 1 && currentWaterLevel >= 1) {
			// add the cost of moving through water
			int depthDiff = Math.abs(newWaterLevel - currentWaterLevel)
			apRequired += depthDiff
		}
		else if(newWaterLevel >= 1) {
			// add the cost of moving into water when not already in water
			if(newWaterLevel == 1) {
				apRequired += 1
			}
			else if(newWaterLevel > 1) {
				apRequired += 3
			}
		}
		else if(currentWaterLevel >= 1){
			// add the cost of moving out of water when currently in it
			apRequired += currentWaterLevel
		}
		
		return apRequired
	}
	
	/**
	 * Calculates the heat dissipation for the given unit based on game and configuration conditions
	 * @param game
	 * @param unit
	 * @return
	 */
	private double getHeatDissipation(Game game, BattleUnit unit) {
		double externalHeatDissipation = 0
		
		double heatSinkTypeMultiplier = 0
		
		if(unit instanceof BattleMech) {
			HeatSink heatSink
			if(unit.mech?.heatSinkType == Unit.HS_SINGLE) {
				heatSink = HeatSink.findByName(MechMTF.MTF_CRIT_HEATSINK)
			}
			else if(unit.mech?.heatSinkType == Unit.HS_DOUBLE) {
				heatSink = HeatSink.findByName(MechMTF.MTF_CRIT_DBL_HEATSINK)
			}
			
			heatSinkTypeMultiplier = heatSink?.dissipation ?: 0
			
			// each mech starts with 10 heat sinks included in the engine
			def engineHeatSinks = 10
			
			// if the mech is in Water, increase heat dissipation by double for each heat sink in the water (max of 6)
			Hex unitHex = game.board?.getHexAt(unit.x, unit.y)
			int unitWaterLevel = unitHex.getTerrainLevel(Terrain.WATER)
			
			// find how many unique functional heat sinks are in the unit
			def equipHeatSinks = [:]
			def waterHeatSinks = [:]
			
			def allCritSections = unit.getAllCritSections()
			for(int critSectionIndex = 0; critSectionIndex < allCritSections.size(); critSectionIndex++) {
				BattleEquipment[] critSection = allCritSections[critSectionIndex]
				
				for(BattleEquipment equip in critSection) {
					if(equip.isActive()
							&& equip.equipment instanceof HeatSink) {
							
						// since each heat sink can be referenced multiple times, need to store by id to only count once
						equipHeatSinks[equip.id] = equip
						
						if(unitWaterLevel > 1 
								|| (unitWaterLevel == 1 && Mech.LEGS.contains(critSectionIndex))) {
							// At level 1 water only count heatsinks in the legs, if deeper count all
							waterHeatSinks[equip.id] = equip 
						}
					}
					else if(!equip.isActive() 
							&& (MechMTF.MTF_CRIT_ENGINE == equip.getName()
								|| MechMTF.MTF_CRIT_FUSION_ENGINE == equip.getName())) {
						// reduce engine heat sink capability by 5 for each engine crit
						def engineHitReduction = (engineHeatSinks >= 5) ? 5 : engineHeatSinks
						if(engineHeatSinks > 0) {
							engineHeatSinks -= engineHitReduction
						}
					}
				}
			}
			
			int numEquipHeatSinks = equipHeatSinks.size()
			int numWaterHeatSinks = waterHeatSinks.size()
			if(numWaterHeatSinks > 6) {
				// max of 6 heat sinks can be double efficient in water
				numWaterHeatSinks = 6
			}
			
			externalHeatDissipation += engineHeatSinks + numEquipHeatSinks + numWaterHeatSinks
		}
		
		return (externalHeatDissipation * heatSinkTypeMultiplier)
	}
	
	/**
	 * Determines and returns the combat status of the unit
	 * @param unit
	 * @return
	 */
	public static CombatStatus getUnitCombatStatus(Game game, BattleUnit unit){
		if(unit.status == BattleUnit.STATUS_DESTROYED){
			return CombatStatus.UNIT_DESTROYED
		}
		else if(unit.shutdown){
			return CombatStatus.UNIT_IMMOBILE
		}
		else if(unit.prone){
			return CombatStatus.UNIT_PRONE
		}
		
		
		if(unit.jpMoved >= 0){
			// since rotation doesn't use JP, it initializes at -1 to indicate the unit has not jumped
			// and sets to zero when a jump rotate is performed
			return CombatStatus.UNIT_JUMPING
		}
		else if(unit.apMoved == 0){
			return CombatStatus.UNIT_STANDING
		}
		else if(unit.apRemaining < (unit.apMoved * 1/3)){
			// Running is defined as when your mech is moving at greater than or 
			// equal to 66% of your AP for the turn (33% remaining AP)
			return CombatStatus.UNIT_RUNNING
		}
		else{
			return CombatStatus.UNIT_WALKING
		}
	}
	
	/**
	 * Gets the hex range from the source Coords to the target Coords
	 * @param sourceC
	 * @param targetC
	 * @return
	 */
	public static int getRange(Coords sourceC, Coords targetC){
		// based off of 
		// http://www.rossmack.com/ab/RPG/traveller/AstroHexDistance.asp 
		// it is no longer present, now only at web.archive.org
		
		if(sourceC == null || targetC == null)	return -1
		
		def xd, ym, ymin, ymax, yo
		xd = Math.abs(sourceC.x - targetC.x)
		yo = Math.floor(xd / 2) + (!sourceC.isXOdd() && targetC.isXOdd() ? 1 : 0)
		ymin = sourceC.y - yo
		ymax = ymin + xd
		ym = 0
		if (targetC.y < ymin) {
			ym = ymin - targetC.y
		}
		if (targetC.y > ymax) {
			ym = targetC.y - ymax
		}
		
		def range = xd + ym
		
		return range
	}
	
	/**
	 * returns the direction of the target relative to the heading of the source using Mech objects as input
	 * @param srcUnit
	 * @param tgtUnit
	 * @return
	 */
	public static RelativeDirection getRelativeDirection(BattleUnit srcUnit, BattleUnit tgtUnit) {
		return getRelativeDirectionFrom(srcUnit.getLocation(), srcUnit.heading, tgtUnit.getLocation())
	}
	

	/**
	 * returns the direction of the target relative to the heading of the source
	 * @param srcLocation
	 * @param srcHeading
	 * @param tgtLocation
	 * @return
	 */
	public static RelativeDirection getRelativeDirectionFrom(Coords srcLocation, int srcHeading, Coords tgtLocation) {
		if(srcLocation == null || srcHeading == null || tgtLocation == null) {
			return null;
		}
		
		int toDegree = srcLocation.degree(tgtLocation)
		int srcDegree = getHeadingDegrees(srcHeading)
		
		int diffDegree = toDegree - srcDegree
		if(diffDegree < 0){
			diffDegree = 360 + diffDegree
		}
		
		RelativeDirection relDirection = RelativeDirection.FRONT
		if(diffDegree >= 270 || diffDegree <= 90) {
			relDirection = RelativeDirection.FRONT
		}
		else if(diffDegree > 90 && diffDegree < 150) {
			relDirection = RelativeDirection.RIGHT
		}
		else if(diffDegree >= 150 && diffDegree <= 210) {
			relDirection = RelativeDirection.REAR
		}
		else if(diffDegree > 210 && diffDegree < 270) {
			relDirection = RelativeDirection.LEFT
		}
		
		return relDirection
	}
	
	/**
	 * gets the degree direction of the heading given
	 * @param heading
	 * @return
	 */
	public static int getHeadingDegrees(int heading) {
		int degrees = 0
		
		switch(heading) {
			case 0: //"N"
				degrees = 0
				break
				
			case 1: //"NE"
				degrees = 60
				break
				
			case 2: //"SE"
				degrees = 120
				break
				
			case 3: //"S"
				degrees = 180
				break
				
			case 4: //"SW"
				degrees = 240
				break
				
			case 5: //"NW"
				degrees = 300
				break
				
			default: //"WTF"
				break
		}
		
		return degrees
	}
	
	/**
	 * returns the compass direction of the degrees given
	 * @param degrees
	 * @return
	 */
	public static int getDegreesHeading(int degrees) {
		int heading = 0
		
		if(degrees >= 330 || degrees <= 30) {
			heading = 0
		}
		else if(degrees > 30 && degrees <= 90) {
			heading = 1
		}
		else if(degrees > 90 && degrees < 150) {
			heading = 2
		}
		else if(degrees >= 150 && degrees <= 210) {
			heading = 3
		}
		else if(degrees > 210 && degrees < 270) {
			heading = 4
		}
		else{
			heading = 5
		}
		
		return heading
	}
	
	/**
	 * Developer use only
	 * @param game
	 * @param damage
	 * @param target
	 * @param hitLocation
	 * @return
	 */
	public def devDamageTarget(Game game, int damage, BattleUnit target, int hitLocation) {
		if(!isRootUser()) return
		
		log.info("devDamage to "+target.toString()+" for "+damage+" in the "+hitLocation)
		
		def critsHitList = applyDamage(game, damage, target, hitLocation)
		
		log.info("  critsHitList: "+critsHitList)
		
		target.save flush:true
		
		def devWeaponFire = [weaponId: null]
		def devWeaponData = [
			unit: target.id,
			target: target.id,
			weaponFire: devWeaponFire,
			armorHit: target.armor,
			internalsHit: target.internals
		]
		
		devWeaponFire.weaponHit = true
		devWeaponFire.weaponHitLocations = []
		devWeaponFire.weaponHitLocations[hitLocation] = damage
		
		def locationStr = Mech.getLocationText(hitLocation)
		def damageByLocationStr = String.valueOf(damage)
		
		def devMessageCode = "game.weapon.hit"
		Object[] devMessageArgs = ["DEV", target.getPilotCallsign(), "BFG", damageByLocationStr, locationStr]
		
		Date update = addMessageUpdate(game, devMessageCode, devMessageArgs, devWeaponData)
		
		return
	}
	
	/**
	 * Developer use only
	 * @param game
	 * @param crits
	 * @param target
	 * @param hitLocation
	 * @return
	 */
	public def devCritTarget(Game game, int crits, BattleUnit target, int hitLocation) {
		if(!isRootUser()) return
		
		log.info("devCrit to "+target.toString()+" for "+crits+" in the "+hitLocation)
		
		def critsHitList = applyCriticalHit(game, target, hitLocation, crits)
		
		log.info("  critsHitList: "+critsHitList)
		
		def checkSuccess = checkCriticalsHitPilotSkill(game, target, critsHitList)
		
		target.save flush:true
		
		def devWeaponFire = [weaponId: null]
		def devWeaponData = [
			unit: target.id,
			target: target.id,
			weaponFire: devWeaponFire,
			armorHit: target.armor,
			internalsHit: target.internals
		]
		
		devWeaponFire.weaponHit = true
		devWeaponFire.weaponHitLocations = []
		devWeaponFire.weaponHitLocations[hitLocation] = 0
		
		def locationStr = Mech.getLocationText(hitLocation)
		def damageByLocationStr = String.valueOf(0)
		
		def devMessageCode = "game.weapon.hit"
		Object[] devMessageArgs = ["DEV", target.getPilotCallsign(), "CRIT", damageByLocationStr, locationStr]
		
		Date update = addMessageUpdate(game, devMessageCode, devMessageArgs, devWeaponData)
		
		return
	}
	
	/**
	 * Adds message and/or data updates based on actions performed in the game
	 * @param game
	 * @param messageCode
	 * @param messageArgs
	 * @param data
	 * @return
	 */
	def addMessageUpdate(Game game, String messageCode, Object[] messageArgs, Map data) {
		if(game == null) return new Date(0)
		
		def time = new Date().getTime()
		
		if(messageCode != null && messageCode.length() > 0) {
			gameChatService.addMessageUpdate(game, messageCode, messageArgs, time)
		}
		
		if(data != null && !data.isEmpty()) {
			String mapping = GameMeteorHandler.MAPPING_GAME +"/"+ game.id
			data.time = time
			
			log.debug "GameService.addActionUpdate: ${mapping} = ${data}"
			
			def finishedResponse = data as JSON
			metaBroadcaster.broadcastTo(mapping, finishedResponse)
		}
				
		return new Date(time)
	}
	
	/**
	 * Returns true if the current user's roles contains the ROOT role
	 * @return
	 */
	private boolean isRootUser() {
		def roles = springSecurityService.getPrincipal().getAuthorities()
		
		for(def role in roles) {
			if(role.getAuthority() == Role.ROLE_ROOT) {
				return true
			}
		}
		
		return false
	}
}
