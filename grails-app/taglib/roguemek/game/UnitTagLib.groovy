package roguemek.game

import roguemek.model.Unit

class UnitTagLib {
    static defaultEncodeAs = [taglib:'text']
    //static encodeAsForTags = [tagName: [taglib:'html'], otherTagName: [taglib:'none']]
	
	def unitService
	
	/**
	 * Generates an image to the url of the image for the unit
	 *
	 * @attr unitId REQUIRED the id of the Unit (not BattleUnit) 
	 */
	def unitImage = { attrs, body ->
		def unitId = attrs.unitId
		if(!unitId) return
		
		Unit unit = Unit.read(unitId)
		if(!unit) return
		
		def imagePath = unitService.getUnitImagePath(unit)
		def imageURL = "${assetPath(src: imagePath)}"
		out << "<img class='unit-preview' src='${imageURL}'/>"
	}
}
