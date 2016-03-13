package roguemek.game

import roguemek.model.Unit

class UnitTagLib {
    static defaultEncodeAs = [taglib:'text']
    //static encodeAsForTags = [tagName: [taglib:'html'], otherTagName: [taglib:'none']]
	
	def unitService
	
	/**
	 * Generates an image to the url of the image for the unit
	 *
	 * @attr unitId REQUIRED the id of the Unit domain object (not BattleUnit)
	 * @attr animated OPTIONAL boolean value of whether to have it animated spinning (default: true)
	 */
	def unitImage = { attrs, body ->
		def unitId = attrs.unitId
		if(!unitId) return
		
		Unit unit = Unit.read(unitId)
		if(!unit) return
		
		def animated = (attrs.animated != null) ? Boolean.valueOf(attrs.animated) : true
		
		def imagePath = unitService.getUnitImagePath(unit)
		def imageURL = "${assetPath(src: imagePath)}"
		def imageClass = (animated) ? "unit-preview" : "unit-preview-static"
		
		out << "<img class='${imageClass}' src='${imageURL}'/>"
	}
}
