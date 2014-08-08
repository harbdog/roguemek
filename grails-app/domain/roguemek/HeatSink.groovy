package roguemek

class HeatSink extends Equipment {
	
	Double dissipation

    static constraints = {
		dissipation min: 0.0D
    }
}
