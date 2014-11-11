package roguemek.game

/**
 * Stores and x,y value pair as coordinates for a Hex
 * Source from MegaMek Coords.java
 *
 */
class Coords {
	public static final double HEXSIDE = Math.PI / 3.0
	
	public int x
	public int y
	
	public Coords() {
		this(0, 0)
	}
	
	public Coords(int x, int y) {
		this.x = x
		this.y = y
	}
	
	public String toString() {
		return "["+this.x+","+this.y+"]"
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
	
	/**
     * Returns a new coordinate that represents the coordinate 1 unit in the
     * specified direction.
     * 
     * @return the new coordinate, if the direction is valid; otherwise, a new
     *         copy of this coordinate.
     * @param dir the direction.
     */
    public final Coords translated(int dir) {
        return new Coords(xInDir(x, y, dir), yInDir(x, y, dir))
    }

    public final Coords translated(int dir, int distance) {
        int newx = xInDir(x, y, dir, distance)
        int newy = yInDir(x, y, dir, distance)
        return new Coords(newx, newy)
    }

    public final Coords translated(String dir) {
        int intDir = 0

        try {
            intDir = Integer.parseInt(dir);
        } catch (NumberFormatException nfe) {
            if (dir.equalsIgnoreCase("N")) {
                intDir = 0
            } else if (dir.equalsIgnoreCase("NE")) {
                intDir = 1
            } else if (dir.equalsIgnoreCase("SE")) {
                intDir = 2
            } else if (dir.equalsIgnoreCase("S")) {
                intDir = 3
            } else if (dir.equalsIgnoreCase("SW")) {
                intDir = 4
            } else if (dir.equalsIgnoreCase("NW")) {
                intDir = 5
            }
        }

        return translated(intDir)
    }

    /**
     * Returns the x parameter of the coordinates in the direction
     */
    public final static int xInDir(int x, int y, int dir) {
        switch (dir) {
            case 1:
            case 2:
                return x + 1
            case 4:
            case 5:
                return x - 1
            default:
                return x
        }
    }

    public final static int xInDir(int x, int y, int dir, int distance) {
        switch (dir) {
            case 1:
            case 2:
                return x + distance
            case 4:
            case 5:
                return x - distance
            default:
                return x
        }
    }

    /**
     * Returns the y parameter of the coordinates in the direction
     */
    public final static int yInDir(int x, int y, int dir) {
        switch (dir) {
            case 0:
                return y - 1
            case 1:
            case 5:
                return y - ((x + 1) & 1)
            case 2:
            case 4:
                return y + (x & 1)
            case 3:
                return y + 1
            default:
                return y
        }
    }

    public final static int yInDir(int x, int y, int dir, int distance) {
        switch (dir) {
            case 0:
                return y - distance
            case 1:
            case 5:
                if ((x & 1) == 1)
                    return y - (distance / 2)
                return y - ((distance + 1) / 2)
            case 2:
            case 4:
                if ((x & 1) == 0)
                    return y + (distance / 2)
                return y + ((distance + 1) / 2)
            case 3:
                return y + distance
            default:
                return y
        }
    }
	
	/**
	 * Returns the direction in which another coordinate lies; 0 if the
	 * coordinates are equal.
	 *
	 * @param d the destination coordinate.
	 */
	public int direction(Coords d) {
		return (int) Math.round(radian(d) / HEXSIDE) % 6
	}

	/**
	 * Returns the radian direction of another Coords.
	 *
	 * @param d the destination coordinate.
	 */
	public double radian(Coords d) {
		final IdealHex src = IdealHex.get(this)
		final IdealHex dst = IdealHex.get(d)

		// don't divide by 0
		if (src.cy == dst.cy) {
			return (src.cx < dst.cx) ? Math.PI / 2 : Math.PI * 1.5
		}

		double r = Math.atan((dst.cx - src.cx) / (src.cy - dst.cy))
		// flip if we're upside down
		if (src.cy < dst.cy) {
			r = (r + Math.PI) % (Math.PI * 2)
		}
		// account for negative angles
		if (r < 0) {
			r += Math.PI * 2
		}

		return r
	}

	/**
	 * Returns the degree direction of another Coords.
	 *
	 * @param d the destination coordinate.
	 */
	public int degree(Coords d) {
		return (int) Math.round((180 / Math.PI) * radian(d))
	}

	/**
	 * Returns the distance to another coordinate.
	 */
	public int distance(Coords c) {
		// based off of
		// http://www.rossmack.com/ab/RPG/traveller/AstroHexDistance.asp
		// since I'm too dumb to make my own
		int xd, ym, ymin, ymax, yo
		xd = Math.abs(this.x - c.x)
		yo = (xd / 2) + (!isXOdd() && c.isXOdd() ? 1 : 0)
		ymin = this.y - yo
		ymax = ymin + xd
		ym = 0
		if (c.y < ymin) {
			ym = ymin - c.y
		}
		if (c.y > ymax) {
			ym = c.y - ymax
		}
		return xd + ym
	}

	public int distance(int distx, int disty) {
		return distance(new Coords(distx, disty))
	}
	
	/**
	 * Note: this function can return Coordinates that are not on the board.
	 *
	 * @param src
	 * @param dest
	 * @param split
	 * @return
	 */
	public static ArrayList<Coords> intervening(Coords src, Coords dest, boolean split) {
		IdealHex iSrc = IdealHex.get(src)
		IdealHex iDest = IdealHex.get(dest)

		int[] directions = new int[3]
		int centerDirection = src.direction(dest)
		if (split) {
			// HACK to make left appear before right in the sequence reliably
			centerDirection = (int) Math.round(src.radian(dest) + 0.0001 / HEXSIDE) % 6
		}
		directions[2] = centerDirection // center last
		directions[1] = (centerDirection + 5) % 6
		directions[0] = (centerDirection + 1) % 6

		ArrayList<Coords> hexes = new ArrayList<Coords>()
		Coords current = src

		hexes.add(current)
		while (!dest.equals(current)) {
			current = Coords.nextHex(current, iSrc, iDest, directions)
			hexes.add(current)
		}

		return hexes
	}

	/**
	 * Returns the first further hex found along the line from the centers of
	 * src to dest. Checks the three directions given and returns the closest.
	 * This relies on the side directions being given first. If it checked the
	 * center first, it would end up missing the side hexes sometimes. Not the
	 * most elegant solution, but it works.
	 */
	public static Coords nextHex(Coords current, IdealHex iSrc, IdealHex iDest, int[] directions) {
		for (int i = 0; i < directions.length; i++) {
			Coords testing = current.translated(directions[i])
			if (IdealHex.get(testing).isIntersectedBy(iSrc.cx, iSrc.cy,
					iDest.cx, iDest.cy)) {
				return testing
			}
		}
		// if we're here then something's fishy!
		throw new RuntimeException("Couldn't find the next hex!")
	}

	/**
	 * Pass-thru version of the above that assumes current = iSrc.
	 */
	public static Coords nextHex(Coords current, Coords destination) {
		if (current == destination)
			return current
			
		int[] directions
		if (current.x == destination.x) {
			if (current.y > destination.y) {
				directions = new int[1]
				directions[0] = 0
			} else {
				directions = new int[1]
				directions[0] = 3
			}
		} else if (current.x > destination.x) {
			if (current.y > destination.y) {
				directions = new int[3]
				directions[0] = 4
				directions[1] = 5
				directions[2] = 0
			} else {
				directions = new int[3]
				directions[0] = 3
				directions[1] = 4
				directions[2] = 5
			}
		} else {
			if (current.y > destination.y) {
				directions = new int[3]
				directions[0] = 0
				directions[1] = 1
				directions[2] = 2
			} else {
				directions = new int[3]
				directions[0] = 1
				directions[1] = 2
				directions[2] = 3
			}
		}
		return nextHex(current, new IdealHex(current), new IdealHex(destination), directions)
	}
}
