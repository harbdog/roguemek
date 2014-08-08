package roguemek.model

class Ammo extends Equipment {

	Integer ammoPerTon
	Boolean explosive
	
	static belongsTo = [weapons:Weapon]
	
    static constraints = {
		ammoPerTon min: 1
		explosive nullable: false
		
		weapons nullable: true
    }
}
