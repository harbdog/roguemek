package roguemek.game

class BattleInfoTagLib {
    static defaultEncodeAs = [taglib:'html']
    //static encodeAsForTags = [tagName: [taglib:'html'], otherTagName: [taglib:'none']]
	
	/**
	 * Gives the appropriate css class for color based on the percent value given
	 * 
	 * @attr percent REQUIRED the percent value between 0-100%, inclusive
	 */
	def colorPercentClass = { attrs, body ->
		def percent = attrs.percent
		
		def colorClass = "color100percent"
		if(percent <= 25) {
			colorClass = "color25percent"
		}
		else if(percent <= 50) {
			colorClass = "color50percent"
		}
		else if(percent <= 75) {
			colorClass = "color75percent"
		}
		
		out << colorClass
	}
}
