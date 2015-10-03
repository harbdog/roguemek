package roguemek.game

import grails.transaction.Transactional
import roguemek.*
import roguemek.model.*
import roguemek.mtf.*

@Transactional
class GameService {
	
	transient springSecurityService
	
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
		
		game.gameState = Game.GAME_ACTIVE
		game.gameTurn = 0
		
		// TODO: perform initiative roll on first and every 4 turns after to change up the order of the units turn
		// game.units...
		game.unitTurn = 0
		
		// get the first unit ready for its turn
		initializeTurnUnit(game)
		
		game.save flush: true
	}
	
	/**
	 * Starts the next unit's turn
	 * @return
	 */
	public def initializeNextTurn(Game game) {
		game.unitTurn ++
		// TODO: account for destroyed units
		
		if(game.unitTurn >= game.units.size()) {
			game.gameTurn ++
			game.unitTurn = 0
		}
		
		// update the next unit for its new turn
		def data = initializeTurnUnit(game)
		
		game.save flush: true
		
		// return and add game message about the next unit's turn
		BattleUnit turnUnit = game.getTurnUnit()
		
		Object[] messageArgs = [turnUnit.toString()]
		Date update = GameMessage.addMessageUpdate(game, "game.unit.new.turn", messageArgs, data)
		
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
			if(heatEffects.containsKey(HeatEffect.Effect.AMMO_EXP_RISK)) {
				// TODO: ammo explosion
				int explosionRisk = heatEffects.getAt(HeatEffect.Effect.AMMO_EXP_RISK)
			}
			
			if(heatEffects.containsKey(HeatEffect.Effect.SHUTDOWN_RISK)) {
				// Roll to see if an automatic shutdown is going to occur
				int shutdownPercent = heatEffects.getAt(HeatEffect.Effect.SHUTDOWN_RISK)
				
				if(shutdownPercent >= 100) {
					// TODO: Shutdown the unit
					log.info("Auto shutting down "+unit)
				}
				else {
					int shutdownRoll = Roll.randomInt(100, 1)
					
					if(shutdownRoll < shutdownPercent) {
						// TODO: Shutdown the unit
						log.info("Shutting down "+unit+" | "+shutdownRoll+"/"+shutdownPercent)
					}
					else {
						// Power up the unit if previously shutdown
						log.info("Shutdown avoided "+unit+" | "+shutdownRoll+"/"+shutdownPercent)
					}
				}
			}
			else {
				// Power up the unit if previously shutdown
			}
			
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
				// TODO: when WalkMP is 0, make AP only usable for weapons fire
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
		HexMap board = game?.board
		
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
				apRemaining: u.apRemaining,
				jpRemaining: u.jpRemaining,
				jumpJets: u.mech?.jumpMP,
				jumping: (u.jpMoved >= 0),
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
			equipRender.ammoExplosive = e.explosive
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
		
		int moveHeading = forward ? unit.heading : ((unit.heading + 3) % 6)
		Coords unitCoords = unit.getLocation()
		
		// check to see if the new hex can be moved into
		Coords moveCoords = GameService.getForwardCoords(game, unitCoords, moveHeading)
		
		def notMoving = (moveCoords.equals(unitCoords))
		if(notMoving) {
			return 0
		}
		
		// check to see if there is another unit already in the coords
		def unitObstacles = game.getUnitsAt(moveCoords.x, moveCoords.y)
		if(unitObstacles.length > 0) {
			// TODO: Charging/DFA if a unit is present at the new coords
			return 0
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
		
		int moveHeading = forward ? unit.heading : ((unit.heading + 3) % 6)
		Coords unitCoords = unit.getLocation()
		
		// check to see if the new hex can be moved into
		Coords moveCoords = GameService.getForwardCoords(game, unitCoords, moveHeading)
		
		def notMoving = (moveCoords.equals(unitCoords))
		if(notMoving) {
			return new GameMessage("game.you.cannot.move.edge", null, null)
		}
		
		// check to see if there is another unit already in the coords
		def unitObstacles = game.getUnitsAt(moveCoords.x, moveCoords.y)
		if(unitObstacles.length > 0) {
			return new GameMessage("game.you.cannot.move.unit", null, null)
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
		
		unit.hexesMoved ++
		unit.x = moveCoords.x
		unit.y = moveCoords.y
		
		// If changing movement status to WALKING or RUNNING, add the appropriate heat
		CombatStatus unitStatus = getUnitCombatStatus(game, unit)
		double heatGen = 0
		if(unitStatus == CombatStatus.UNIT_WALKING 
				&& prevUnitStatus != CombatStatus.UNIT_WALKING) {
			// Add 1 heat per round for starting to walk
			heatGen = (1 / game.turnsPerRound)
		}
		else if(unitStatus == CombatStatus.UNIT_RUNNING 
				&& prevUnitStatus == CombatStatus.UNIT_WALKING) {
			// Add 1 heat per round for going from walk to run
			heatGen = (1 / game.turnsPerRound)
		}
		else if(unitStatus == CombatStatus.UNIT_RUNNING 
				&& prevUnitStatus != CombatStatus.UNIT_WALKING 
				&& prevUnitStatus != CombatStatus.UNIT_RUNNING) {
			// Add 2 heat per round for going straight to run
			heatGen = (2 / game.turnsPerRound)
		}
		else if(unitStatus == CombatStatus.UNIT_JUMPING) {
			// add heat for JUMPING, the initial jump is 3 heat, then after 3 jumps more heat is generated
			if(unit.jpMoved > 3) {
				heatGen = (1 / game.turnsPerRound)
			}
			else if(initiatedJumping){
				heatGen = (3 / game.turnsPerRound)
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
			heat: unit.heat,
			moveAP: moveAP
		]
		
		Object[] messageArgs = [unit.toString(), unit.x, unit.y]
		Date update = GameMessage.addMessageUpdate(
				game, 
				jumping ? "game.unit.jumped" : "game.unit.moved", 
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
				heatGen = (3 / game.turnsPerRound)
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
				heatGen = (1 / game.turnsPerRound)
			}
			else if(unitStatus == CombatStatus.UNIT_RUNNING
					&& prevUnitStatus == CombatStatus.UNIT_WALKING) {
				// Add 1 heat per round for going from walk to run
				heatGen = (1 / game.turnsPerRound)
			}
			else if(unitStatus == CombatStatus.UNIT_RUNNING
					&& prevUnitStatus != CombatStatus.UNIT_WALKING
					&& prevUnitStatus != CombatStatus.UNIT_RUNNING) {
				// Add 2 heat per round for going straight to run
				heatGen = (2 / game.turnsPerRound)
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
			heat: unit.heat,
			moveAP: moveAP
		]
		
		Object[] messageArgs = [unit.toString(), unit.heading]
		Date update = GameMessage.addMessageUpdate(
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
		HexMap board = game?.board;
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
	public static Coords handleDisplacement(Game game, BattleUnit unit, int displaceHeading){
		
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
					
					// TODO: mech obstacle must make a pilot skill roll to avoid falling from domino effect
					//doPilotSkillRoll(mechObstacle)
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
			Date update = GameMessage.addMessageUpdate(
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
				unit.save flush: true, deepValidate: false
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
			jumping: jumping
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
		
		if(unit.apRemaining == 0) {
			// not enough action points to fire
			return new GameMessage("game.you.cannot.fire.ap.zero", null, null)
		}
		
		def data = [
			unit: unit.id,
			target: target.id
		]
		
		def unitWeapons = unit.getWeapons()
		
		int totalHeat = 0
		
		for(BattleWeapon weapon in weapons) {
			// make sure the weapon is attached to the unit that is firing
			if(!unitWeapons.contains(weapon)) continue
			
			// make sure the weapon is not on cooldown still
			if(weapon.cooldown > 0) continue
			
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
						BattleEquipment[] ammoEquipment = unit.getEquipmentFromBaseObject(ammo)
						for(BattleEquipment ammoEquip in ammoEquipment) {
							data.ammoRemaining[ammoEquip.id] = ammoEquip.ammoRemaining
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
							applyDamage(game, actualDamage, target, hitLocation)
							
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
						}
						else if(weapon.isDFA()) {
							// attacking unit takes 1 point of damage for every 5 tons the attacking unit weighs to the legs
							attackerDamage = (unit instanceof BattleMech) ? Math.ceil(unit.mech.mass / 5) : 0
							selfHitLocations = Mech.FRONT_KICK_LOCATIONS
						}
						
						if(attackerDamage > 0 && selfHitLocations != null) {
							def selfData = selfDamage(game, attackerDamage, unit, selfHitLocations)
							
							String selfAttackerDamage = String.valueOf(selfData.damage)
							String selfLocationStr = Mech.getLocationText(selfData.hitLocation)
							
							Object[] selfMessageArgs = [unit.toString(), selfAttackerDamage, weapon.getShortName(), selfLocationStr]
							Date update = GameMessage.addMessageUpdate(
									game,
									"game.unit.damage.self",
									selfMessageArgs, selfData)
						}
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
					// TODO: kick missed, perform a piloting skill roll
				}
				else if(weapon.isCharge()) {
					// charge missed, displace to another location
					Coords unitLocation = unit.getLocation()
					Hex origHex = game.getHexAt(unitLocation)
					
					int headingLeft = getRotateHeadingCCW(unit.heading)
					Coords displacedLeft = getForwardCoords(unitLocation, headingLeft)
					
					int headingRight = getRotateHeadingCW(unit.heading)
					Coords displacedRight = getForwardCoords(unitLocation, headingRight)
					
					// handle if the new displaced location cannot be entered, or if an existing unit is in that location
					int displacedHeading = null
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
					
					Coords displacedLocation = handleDisplacement(game, unit, displacedHeading)
				}
				else if(weapon.isDFA()) {
					// TODO: DFA attack missed, the attacker falls automatically at its current position and takes falling damage
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
			Date update = GameMessage.addMessageUpdate(game, messageCode, messageArgs, thisWeaponData)
		}
		
		// update return data with target armor/internals
		// TODO: make the applyDamage method return hash of locations damaged instead of the entire armor/internals array
		data.armorHit = target.armor
		data.internalsHit = target.internals
		
		// apply the total weapon heat
		unit.heat += totalHeat
		data.heat = unit.heat
		
		// use an actionPoint
		unit.apRemaining -= 1
		data.apRemaining = unit.apRemaining
		
		unit.save flush:true
		target.save flush:true
		
		// Add data only update information about the unit and target
		Date update = GameMessage.addMessageUpdate(game, null, null, data)
		
		// automatically end the unit's turn after firing
		this.initializeNextTurn(game)
		
		// TODO: handle returning all of the individual data arrays instead of just the last
		return data
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
			def fromLocationMods = WeaponModifier.getToHitModifiersFromLocation(game, srcLocation, tgtUnit)
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
		if(unit.isDestroyed()) {
			return
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
			return
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
		while(damage > 0 && unit.internals[critLocation] > 0) {
			unit.internals[critLocation] --
			damage --
			
			critChance = true
			
			unit.damageTaken ++
		}
		
		if(critChance) {
			// send off to see what criticals might get hit
			applyCriticalHit(game, unit, critLocation);
		}
		
		if(unit.internals[Mech.HEAD] == 0 || unit.internals[Mech.CENTER_TORSO] == 0) {
			// if head or center internal are gone, the unit is dead
			//debug.log("Head or CT internal destroyed!");
			unit.status = BattleUnit.STATUS_DESTROYED
			
			// create destroyed message info
			/*var gm = new GameMessage(unit, true, ((playerMech == unit) ? playerName : unit.chassis) + " has been destroyed.", SEV_HIGH);
			messages.push(gm);*/
			
			return
		}
		else if(unit.internals[Mech.LEFT_LEG] == 0 && unit.internals[Mech.RIGHT_LEG] == 0) {
			// if both of the legs internal are gone, the unit is dead
			//debug.log("Both legs destroyed!");
			unit.status = BattleUnit.STATUS_DESTROYED
			
			// create destroyed message info
			/*var gm = new GameMessage(unit, true, ((playerMech == unit) ? playerName : unit.chassis) + " has been destroyed.", SEV_HIGH);
			messages.push(gm);*/
			
			return
		}
		
		if(unit.internals[Mech.LEFT_TORSO] == 0) {
			// the LEFT_ARM and REAR needs to be gone if the torso is gone
			destroyLocation(unit, Mech.LEFT_TORSO)
			destroyLocation(unit, Mech.LEFT_ARM)
		}
		
		if(unit.internals[Mech.RIGHT_TORSO] == 0) {
			// the RIGHT_ARM and REAR needs to be gone if the torso is gone
			destroyLocation(unit, Mech.RIGHT_TORSO)
			destroyLocation(unit, Mech.RIGHT_ARM)
		}
		
		// TODO: update any destroyed weapons in locations with no remaining internal armor
		//updateDestroyedWeapons(unit);
		
		// any damage remaining after internals needs spread to other parts unless it was the Head or Center Torso (in which case the unit was already pronounced dead)
		if(damage == 0 || unit.isDestroyed()) {
			return
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
	
	private void destroyLocation(BattleUnit unit, int hitLocation) {
		if(unit instanceof BattleMech) {
			unit.internals[hitLocation] = 0
		}
		else{
			log.debug("BattleUnit instance "+unit+" unable to have location "+hitLocation+" destroyed")
		}
	}
	
	/**
	 * Rolls to see if a critical hit will occur when the hitLocation has been damaged internally, and applies the result
	 */
	public def applyCriticalHit(Game game, BattleUnit unit, int hitLocation) {
		return applyCriticalHit(game, unit, hitLocation, 0)
	}
	
	/**
	 * Rolls to see if a critical hit will occur when the hitLocation has been damaged internally, and applies the result
	 */
	public def applyCriticalHit(Game game, BattleUnit unit, int hitLocation, int numHits) {
		if(unit.isDestroyed()) return
		
		def dieResult = Roll.rollD6(2)
		def locationStr = Mech.getLocationText(hitLocation)
		
		if(numHits == 0) {
			if(dieResult >= 12) {
				// 3 critical hits, or Head/Limb blown off
				numHits = 3
				
				if(hitLocation == Mech.HEAD || hitLocation == Mech.LEFT_ARM || hitLocation == Mech.RIGHT_ARM 
						|| hitLocation == Mech.LEFT_LEG || hitLocation == Mech.RIGHT_LEG) {
					// limb blown off!
					destroyLocation(unit, hitLocation)
					
					// TODO: include data in the message for the lost limb
					def data = [:]
					Object[] messageArgs = [unit.toString(), locationStr]
					Date update = GameMessage.addMessageUpdate(game, "game.unit.critical.limb", messageArgs, data)
					
					return
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
				return
			}
		}
		
		// determine number of critical spaces that can still be hit
		def availableCrits = [:]
		BattleEquipment[] critSection
		
		if(unit instanceof BattleMech) {
			critSection = unit.getCritSection(hitLocation)
		}
		
		if(critSection == null) {
			log.error("No crit section "+hitLocation+" for unit "+unit)
			return
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
					log.info("Crit found for active equipment "+thisEquip.toString()+": "+i)
				}
				else if(thisEquip.isDamaged()) {
					// equipment is damaged and may have some crits available to damage further
					if(thisEquip.criticalHits.length > 0
							&& thisEquip.criticalHits[critIndex] != true) {
						// TODO: handle equipment whose crits span more than one section
						log.info("Crit found for damaged equipment "+thisEquip.toString()+": "+i)
						availableCrits.put(i, [thisEquip: thisEquip, critIndex: critIndex])
					}
				}
			}
		}
		
		def numCrits = availableCrits.size()
		log.info("Crits available to hit: "+numCrits)
		log.info(availableCrits)
		
		if(numCrits == 0) {
			// TODO: apply critical hits to next location according to damage transfer
			log.info("No Critical hits remain on "+hitLocation+" for unit "+unit)
		}
		else {
			if(numHits > numCrits) {
				numHits = numCrits
			}
			
			// roll for each hit to see what component is destroyed/damaged
			log.info("Critical hits on "+hitLocation+": "+numHits+" for unit "+unit)
			
			def availableCritKeys = availableCrits.keySet().toArray()
			def availableCritValues = availableCrits.values().toArray()
			
			log.info("availbleCritvalues="+availableCritValues)
			
			for(def n = 0; n < numHits; n++) {
				def dieCrit = Roll.randomInt(numCrits, 1)
				def critHitKey = availableCritKeys[dieCrit - 1]
				def critHit = availableCritValues[dieCrit - 1]
				
				// remove key and regenerated the values/keys arrays
				availableCrits.remove(critHitKey)
				availableCritKeys = availableCrits.keySet().toArray()
				availableCritValues = availableCrits.values().toArray()
				
				log.info("  critHitKey="+critHitKey+": "+critHit)
				
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
					
					log.info("    Applied first critical hit to "+critEquip+" at "+critHitKey + " ("+critEquip.id+")")
				}
				else {
					critEquip.criticalHits[critIndex] = true
					
					log.info("    Applied another critical hit to "+critEquip+" at "+critHitKey + " ("+critEquip.id+")")
					
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
						
						log.info("    Destroyed "+critEquip+"!!!")
					}
				}
				
				critEquip.save flush:true
				
				// TODO: include data in the message for the damaged/destroyed equipment
				def data = [:]
				Object[] messageArgs = [unit.toString(), critEquip.toString(), locationStr]
				Date update = GameMessage.addMessageUpdate(game, "game.unit.critical.hit", messageArgs, data)
				
				numCrits --
			}
		}
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
		
		applyDamage(game, damage, unit, hitLocation)
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
		
		if(currentHex == null || newHex == null) {
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
		int externalHeatDissipation = 0
		
		int heatSinkTypeMultiplier = 1
		
		if(unit instanceof BattleMech) {
			if(unit.mech?.heatSinkType == Unit.HS_DOUBLE) {
				heatSinkTypeMultiplier = 2
			}
			
			// each mech starts with 10 heat sinks included in the engine
			int engineHeatSinks = 10
			
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
					if(equip.equipment instanceof HeatSink
							&& equip.status == BattleEquipment.STATUS_ACTIVE) {
							
						// since each heat sink can be referenced multiple times, need to store by id to only count once
						equipHeatSinks[equip.id] = equip
						
						if(unitWaterLevel > 1 
								|| (unitWaterLevel == 1 && Mech.LEGS.contains(critSectionIndex))) {
							// At level 1 water only count heatsinks in the legs, if deeper count all
							waterHeatSinks[equip.id] = equip 
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
		
		return ((externalHeatDissipation * heatSinkTypeMultiplier) / game.turnsPerRound)
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
		
		applyDamage(game, damage, target, hitLocation)
		
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
		
		Date update = GameMessage.addMessageUpdate(game, devMessageCode, devMessageArgs, devWeaponData)
		
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
		
		applyCriticalHit(game, target, hitLocation, crits)
		
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
		
		Date update = GameMessage.addMessageUpdate(game, devMessageCode, devMessageArgs, devWeaponData)
		
		return
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
