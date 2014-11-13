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
			unit.jpRemaining = unit.jumpPoints
			data.jpRemaining = unit.jpRemaining
		}
		
		// reset ap/hexes moved for the new turn
		unit.apMoved = 0
		unit.hexesMoved = 0
		
		// reset damage taken for the new turn
		unit.damageTaken = 0
		
		unit.save flush: true
		
		return data
	}
	
	/**
	 * Calculates the amount of ActionPoints a unit gets for a new turn.
	 * 1 AP is given per 2 walk MP.
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
			
			ap = Math.floor(walkMPThisTurn / 2) + (walkMPThisTurn % 2)
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
		
		// TODO: generate actual jumpPoints based on functioning jump jets
		int jp = 0
		return jp
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
			def internals = null
			def chassisVariant = null
			def crits = null
			
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
				
				internals = []
				if(u.internals != null) {
					int internalSize = u.internals.size()
					for(int i=0; i<internalSize; i++) {
						internals[i] = u.internals[i]
					}
				}
				
				crits = getCritsRender(u)
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
				heat: u.heat,
				armor: armor,
				internals: internals,
				crits: crits,
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
				critsRender[i] = getEquipmentRender(BattleEquipment.get(u.crits[i]))
			}
		}
		
		return critsRender
	}
	
	/**
	 * Gets a JSON compatible form of Equipment data for the client
	 * @param equip
	 * @return
	 */
	public def getEquipmentRender(BattleEquipment equip) {
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
			// TODO: model e.ammoTypes as something the client can associate or determine ammoRemains by Weapon instead?
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
	 * Moves the unit in a forward/backward direction
	 * @param unit
	 * @param forward
	 * @param jumping
	 * @return
	 */
	public def move(Game game, BattleUnit unit, boolean forward, boolean jumping) {
		if(unit.apRemaining == 0) return
		else if(unit != game.getTurnUnit()) return
		
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
			// TODO: Charging/DFA if a unit is present at the new coords
			return new GameMessage("game.you.cannot.move.unit", null, null)
		}
		
		// calculate the amount of AP required to move
		int apRequired = getHexRequiredAP(game, unitCoords, moveCoords)
		
		if(apRequired > unit.apRemaining && apRequired > unit.actionPoints 
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
		else if (apRequired < 0) {
			return new GameMessage("game.you.cannot.move.direction", null, null)
		}
		
		// TODO: TESTING: Instead, store combat status directly on the unit as a new field
		CombatStatus prevUnitStatus = getUnitCombatStatus(game, unit)
		
		// When ready to move, set the new location of the unit and consume AP
		unit.apRemaining -= apRequired
		unit.apMoved ++
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
		else {
			// TODO: add heat for JUMPING
		}
		unit.heat += heatGen
		
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		def data = [
			unit: unit.id,
			x: unit.x,
			y: unit.y,
			apRemaining: unit.apRemaining,
			heat: unit.heat
		]
		
		Object[] messageArgs = [unit.toString(), unit.x, unit.y]
		Date update = GameMessage.addMessageUpdate(game, "game.unit.moved", messageArgs, data)
		
		if(unit.apRemaining == 0) {
			// automatically end the unit's turn if it has run out of AP
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
		if(unit.apRemaining == 0) return
		else if(unit != game.getTurnUnit()) return
		
		// TODO: TESTING: Instead, store combat status directly on the unit as a new field
		CombatStatus prevUnitStatus = getUnitCombatStatus(game, unit)
		
		// use an actionPoint and register one apMoved
		unit.apRemaining -= 1
		unit.apMoved ++
		
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
		unit.heat += heatGen
		
		// When ready to rotate, set the new location of the unit
		unit.setHeading(newHeading);
		
		// deepValidate needs to be false otherwise it thinks a subclass like BattleMech is missing its requirements
		unit.save flush: true, deepValidate: false
		
		def data = [
			unit: unit.id,
			heading: unit.heading,
			apRemaining: unit.apRemaining,
			heat: unit.heat
		]
		
		Object[] messageArgs = [unit.toString(), unit.heading]
		Date update = GameMessage.addMessageUpdate(game, "game.unit.rotated", messageArgs, data)
		
		if(unit.apRemaining == 0) {
			// automatically end the unit's turn if it has run out of AP
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
				
				// TODO: determine base toHit% based on Pilot skills
				double toHit = 90.0
				def modifiers = WeaponModifier.getToHitModifiers(game, unit, w, target)
				for(WeaponModifier mod in modifiers) {
					toHit -= mod.getValue()
				}
				
				if(toHit < 0) {
					toHit = 0.0
				}
				
				def thisWeaponToHit = [
					weaponId: w.id,
					toHit: toHit
				]
				weaponData.add(thisWeaponToHit)
			}
		}
		
		return data
	}
	
	/**
	 * Fires a weapon at the target
	 * @param unit
	 * @param weapon
	 * @param target
	 * @return
	 */
	public def fireWeaponsAtUnit(Game game, BattleUnit unit, ArrayList weapons, BattleUnit target) {
		if(unit.apRemaining == 0) return
		else if(unit != game.getTurnUnit()) return
		
		def weaponData = []
		def data = [
			unit: unit.id,
			target: target.id,
			weaponData: weaponData
		]
		
		int totalHeat = 0
		
		for(BattleWeapon weapon in weapons) {
			if(weapon.cooldown > 0) continue
			
			// TODO: determine base toHit% based on Pilot skills
			double toHit = 90.0
			def modifiers = WeaponModifier.getToHitModifiers(game, unit, weapon, target)
			for(WeaponModifier mod in modifiers) {
				toHit -= mod.getValue()
			}
			
			boolean weaponHit = false
			if(toHit >= 100) {
				log.info("Weapon "+weapon+" AUTO HIT ("+toHit+")!")
				weaponHit = true
			}
			else if(toHit > 0){
				int result = Roll.randomInt(100, 1)
				if(result <= toHit) {
					log.info("Weapon "+weapon+" HIT! Rolled: "+result+"/"+toHit)
					weaponHit = true
				}
				else {
					log.info("Weapon "+weapon+" MISSED! Rolled: "+result+"/"+toHit)
				}
			}
			
			String messageCode
			Object[] messageArgs
			
			// store data about this weapon fire results
			def thisWeaponData = [
				weaponId: weapon.id,
				weaponHit: weaponHit
			]
			weaponData.add(thisWeaponData)
			
			if(weaponHit) {
				data.armorHit = []
				
				// determine hit location based on relative position of the attack on the target
				int hitLocation = getHitLocation(game, unit, weapon, target)
				
				if(hitLocation < 0) {
					// a hit can still be a miss if legs are rolled with partial cover
					weaponHit = false
					thisWeaponData.weaponHit = false
				}
				else {
					thisWeaponData.weaponHitLocations = []
					
					if(target instanceof BattleMech) {
						// TODO: handle cluster damage weapons (LRM, SRM, etc)
						int damage = weapon.getDamage()
						applyDamage(damage, target, hitLocation)
						
						// set the message of the hit result
						messageCode = "game.weapon.hit"
						messageArgs = [unit.getPilotCallsign(), target.getPilotCallsign(), weapon.getShortName(), damage, Mech.getLocationText(hitLocation)]
					}
				}
			}
			
			if(!weaponHit) {
				// set the message of the missed result
				messageCode = "game.weapon.missed"
				messageArgs = [unit.getPilotCallsign(), target.getPilotCallsign(), weapon.getShortName()]
			}
			
			// add the weapon heat
			totalHeat += weapon.getHeat()
			
			// set the weapon on cooldown
			weapon.cooldown = weapon.getCycle()
			thisWeaponData.weaponCooldown = weapon.cooldown
			
			weapon.save flush:true
			
			// TODO: if applicable, consume ammo
			
			Date update = GameMessage.addMessageUpdate(game, messageCode, messageArgs, data)
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
		
		// TODO: Melee weapon hit locations
		/*def isHatchet = (weapon instanceof WeaponHatchet);
		def isPunch = (weapon instanceof WeaponPunch);
		def isKick = (weapon instanceof WeaponKick);*/
		
		Coords srcLocation = srcUnit.getLocation()
		Coords tgtLocation = tgtUnit.getLocation()
		
		// account for punch/kick/hatchet hit location when target is different elevation
		def srcHex = game.getHexAt(srcLocation)
		def tgtHex = game.getHexAt(tgtLocation);
		def elevationDiff = srcHex.elevation - tgtHex.elevation
		
		// use punch locations for punching at same elevation, or when above target by one elevation level for kick/hatchet
		boolean usePunchLocations = false
		/*def usePunchLocations = ((isPunch && elevationDiff == 0)
				|| (isKick && elevationDiff == 1)
				|| (isHatchet && elevationDiff == 1));*/
		
		
		// use kick locations for kicking at same elevation, or when below target by one elevation level for punch/hatchet
		boolean useKickLocations = false
		/*def useKickLocations = ((isKick && elevationDiff == 0)
				|| (isPunch && elevationDiff == -1)
				|| (isHatchet && elevationDiff == -1));*/
		
		
		// find out if the target has partial cover as it could effect the resulting hit location
		def targetHasCover = false;
		def fromLocationMods = WeaponModifier.getToHitModifiersFromLocation(game, srcLocation, tgtUnit)
		for(int i=0; i<fromLocationMods.size(); i++) {
			def modifier = fromLocationMods[i]
			if(modifier != null
					&& modifier.getType() == WeaponModifier.Modifier.PARTIAL_COVER
					&& modifier.getValue() > 0) {
				
				targetHasCover = true
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
	public def applyDamage(int damage, BattleUnit unit, int hitLocation) {
		if(unit.isDestroyed()) {
			return
		}
		
		log.info("Applying "+damage+" damage to "+unit+" @ "+Mech.getLocationText(hitLocation))
		
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
			// TODO: send off to see what criticals might get hit
			//applyCriticalHit(unit, critLocation);
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
			unit.armor[Mech.LEFT_TORSO] = 0
			unit.armor[Mech.LEFT_REAR] = 0
			unit.armor[Mech.LEFT_ARM] = 0
			unit.internals[Mech.LEFT_ARM] = 0
		}
		
		if(unit.internals[Mech.RIGHT_TORSO] == 0) {
			// the RIGHT_ARM and REAR needs to be gone if the torso is gone
			unit.armor[Mech.RIGHT_TORSO] = 0
			unit.armor[Mech.RIGHT_REAR] = 0
			unit.armor[Mech.RIGHT_ARM] = 0
			unit.internals[Mech.RIGHT_ARM] = 0
		}
		
		// TODO: update any destroyed weapons in locations with no remaining internal armor
		//updateDestroyedWeapons(unit);
		
		// any damage remaining after internals needs spread to other parts unless it was the Head or Center Torso (in which case the unit was already pronounced dead)
		if(damage == 0 || unit.isDestroyed()) {
			return
		}
		else if(hitLocation == Mech.LEFT_ARM || hitLocation == Mech.LEFT_LEG || hitLocation == Mech.LEFT_REAR) {
			return applyDamage(damage, unit, Mech.LEFT_TORSO)
		}
		else if(hitLocation == Mech.RIGHT_ARM || hitLocation == Mech.RIGHT_LEG || hitLocation == Mech.RIGHT_REAR) {
			return applyDamage(damage, unit, Mech.RIGHT_TORSO)
		}
		else if(hitLocation == Mech.LEFT_TORSO || hitLocation == Mech.RIGHT_TORSO) {
			return applyDamage(damage, unit, Mech.CENTER_TORSO)
		}
		else {
			log.error("Who the hell did I hit?  Extra "+damage+" damage from location: "+hitLocation)
		}
	}
	
	/**
	 * checks to see if the location being moved to can be done with respect to elevation and impedence
	 * also the currentXY needs to be adjacent, otherwise it will not mean much
	 * @param game
	 * @param currentCoords
	 * @param newCoords
	 * @return the AP required (-1 if not possible)
	 */
	private int getHexRequiredAP(Game game, Coords currentCoords, Coords newCoords) {
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
		
		if(unit.apMoved == 0){
			return CombatStatus.UNIT_STANDING
		}
		//else if(isJumping){
		//	return MECH_JUMPING;
		//}
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
		
		if(sourceC == null || targetC == null)	return -1;
		
		def xd, ym, ymin, ymax, yo;
		xd = Math.abs(sourceC.x - targetC.x);
		yo = Math.floor(xd / 2) + (!sourceC.isXOdd() && targetC.isXOdd() ? 1 : 0);
		ymin = sourceC.y - yo;
		ymax = ymin + xd;
		ym = 0;
		if (targetC.y < ymin) {
			ym = ymin - targetC.y;
		}
		if (targetC.y > ymax) {
			ym = targetC.y - ymax;
		}
		
		def range = xd + ym;
		
		return range;
	}
	
	/**
	 * Returns true if the current user's roles contains the ROOT role
	 * @return
	 */
	private boolean isRootUser() {
		def roles = springSecurityService.getPrincipal().getAuthorities()
		
		for(def role in roles) {
			if(role.getAuthority() == Role.ROLE_ROOT) {
				return true;
			}
		}
		
		return false;
	}
}
