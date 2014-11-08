package roguemek.game

import grails.transaction.Transactional
import roguemek.*
import roguemek.model.*
import roguemek.mtf.*

@Transactional
class GameService {
	
	transient springSecurityService
	
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
			if(heatEffects.containsKey(HeatEffect.EFFECT_AMMO_EXP_RISK)) {
				// TODO: ammo explosion
				int explosionRisk = heatEffects.getAt(HeatEffect.EFFECT_AMMO_EXP_RISK)
			}
			
			if(heatEffects.containsKey(HeatEffect.EFFECT_SHUTDOWN_RISK)) {
				// Roll to see if an automatic shutdown is going to occur
				int shutdownPercent = heatEffects.getAt(HeatEffect.EFFECT_SHUTDOWN_RISK)
				
				// TODO: implement a proper Roll method
				int shutdownRoll = new Random().nextInt(100)
				
				if(shutdownRoll < shutdownPercent) {
					// TODO: Shutdown the unit
					log.info("Shutting down "+unit+" | "+shutdownRoll+"/"+shutdownPercent)
				}
				else {
					// Power up the unit if previously shutdown
					log.info("Shutdown avoided "+unit+" | "+shutdownRoll+"/"+shutdownPercent)
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
				HeatEffect thisEffect = HeatEffect.getHeatEffectForTypeAt(HeatEffect.EFFECT_MP_REDUCE, unit.heat)
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
		
		var jumpMPReduce = getReduceJumpMP(mech);
		var jumpMPThisTurn = mech.jumpMP - jumpMPReduce;
		
		if(jumpMPThisTurn <= 0){
			return 0;
		}
		
		var maxJP = Math.floor(jumpMPThisTurn / 2) + (jumpMPThisTurn % 2);
		
		var jp = mech.jumpPoints + 1;
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
			
			// TODO: determine toHit using unit, weapon, and target combat variables
			boolean weaponHit = true
			
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
				
				// TODO: determine hit location based on relative position of the attack on the target
				// TODO: implement a proper Roll method
				int hitLocation = Mech.FRONT_HIT_LOCATIONS[new Random().nextInt(Mech.FRONT_HIT_LOCATIONS.size() - 1)]
				
				thisWeaponData.weaponHitLocations = []
				
				if(target instanceof BattleMech) {
					BattleMech t = BattleMech.get(target.id)
					
					// TODO: handle cluster damage weapons (LRM, SRM, etc)
					int damage = weapon.getDamage()
					t.damageTaken += damage
					
					// update damage data by location to be returned
					int totalDamage = thisWeaponData.weaponHitLocations[hitLocation] ?: 0
					thisWeaponData.weaponHitLocations[hitLocation] = totalDamage + damage
					
					int armorRemains = t.armor[hitLocation]
					armorRemains -= damage
					
					if(armorRemains < 0) {
						// internals take leftover damage
						data.internalsHit = []
						
						// TODO: handle internal damage transfer from REAR hit locations
						int internalRemains = t.internals[hitLocation]
						internalRemains += armorRemains
						
						armorRemains = 0
						if(internalRemains < 0) {
							// TODO: implement damage transfer from hit locations that are already destroyed internally
							internalRemains = 0
						}
						
						t.internals[hitLocation] = internalRemains
						
						// add the response location and remaining points of the hit internal section
						data.internalsHit[hitLocation] = internalRemains
					}
					
					t.armor[hitLocation] = armorRemains
					
					// add the response location and remaining points of the hit armor section
					data.armorHit[hitLocation] = armorRemains
					
					t.save flush:true
					
					// set the message of the result
					messageCode = "game.weapon.hit"
					messageArgs = [unit.toString(), target.toString(), weapon.getShortName(), weapon.getDamage()]
				}
			}
			else {
				// set the message of the result
				messageCode = "game.weapon.missed"
				messageArgs = [unit.toString(), target.toString(), weapon.getShortName()]
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
		
		// apply the total weapon heat
		unit.heat += totalHeat
		data.heat = unit.heat
		
		// use an actionPoint
		unit.apRemaining -= 1
		data.apRemaining = unit.apRemaining
		
		unit.save flush:true
		
		// automatically end the unit's turn after firing
		this.initializeNextTurn(game)
		
		// TODO: handle returning all of the individual data arrays instead of just the last
		return data
	}
	
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
	public CombatStatus getUnitCombatStatus(Game game, BattleUnit unit){
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
