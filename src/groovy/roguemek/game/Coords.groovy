package roguemek.game

class Coords {
	public int x
	public int y
	
	public Coords(int x, int y) {
		this.x = x
		this.y = y
	}
	
	public void setLocation(int x, int y) {
		this.x = x
		this.y = y
	}
	
	public boolean equals(Coords thatCoord) {
		if(thatCoord == null) return false
		return (this.x == thatCoord.x && this.y == thatCoord.y)
	}
	
	public boolean isXOdd() {
		return (this.x & 1) == 1
	}
}
