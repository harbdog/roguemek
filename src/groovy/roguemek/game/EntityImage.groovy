package roguemek.game

import org.apache.commons.logging.Log
import org.apache.commons.logging.LogFactory
import java.awt.Component
import java.awt.Canvas
import java.awt.Graphics2D
import java.awt.Image
import java.awt.image.BufferedImage
import java.awt.image.ImageObserver
import java.awt.image.ImageProducer
import java.awt.image.MemoryImageSource
import java.awt.image.PixelGrabber
import javax.imageio.ImageIO

/**
 * A class to handle the image permutations for a unit
 * Sourced from MegeMek TilesetManager.java
 */
class EntityImage {
	private static Log log = LogFactory.getLog(this)
	
	private Image base;
	private Image icon;
	private short[] tint;
	private Image camo;
	
	private Component parent;
	
	private static final int IMG_WIDTH = 84;
	private static final int IMG_HEIGHT = 72;
	private static final int IMG_SIZE = IMG_WIDTH * IMG_HEIGHT;
	
	public EntityImage(InputStream imageStream, short[] rgb) {
		this.base = ImageIO.read(imageStream)
		imageStream.close()
		
		this.tint = rgb
		this.parent = new Canvas()
	}
	
	public EntityImage(InputStream imageStream, InputStream camoStream) {
		this.base = ImageIO.read(imageStream)
		this.camo = ImageIO.read(camoStream)
		imageStream.close()
		camoStream.close()
		
		this.parent = new Canvas()
	}

	public EntityImage(Image base, int tint, Image camo, Component comp) {
		this.base = base;
		this.tint = tint;
		this.camo = camo;
		parent = comp;
	}
	
	public byte[] toByteArray() {
		Image color = applyColor(this.base);
		
		ByteArrayOutputStream baos = new ByteArrayOutputStream()
		ImageIO.write(color, UnitService.imagesExtension, baos)
		
		return baos.toByteArray()
	}

	public Image getCamo() {
		return camo;
	}

	public void loadFacings() {
		base = applyColor(base);

		icon = base.getScaledInstance(IMG_WIDTH * (2/3), IMG_HEIGHT * (2/3), Image.SCALE_SMOOTH);
	}

	public Image loadPreviewImage() {
		base = applyColor(base);
		return base;
	}

	public Image getBase() {
		return base;
	}

	public Image getIcon() {
		return icon;
	}

	private Image applyColor(Image image) {
		Image iMech;
		boolean useCamo = (camo != null);

		iMech = image;

		int[] pMech = new int[IMG_SIZE];
		int[] pCamo = new int[IMG_SIZE];
		PixelGrabber pgMech = new PixelGrabber(iMech, 0, 0, IMG_WIDTH, IMG_HEIGHT, pMech, 0, IMG_WIDTH);

		try {
			pgMech.grabPixels();
		} catch (InterruptedException e) {
			log.error("EntityImage.applyColor(): Failed to grab pixels for mech image." + e.getMessage()); //$NON-NLS-1$
			return image;
		}
		if ((pgMech.getStatus() & ImageObserver.ABORT) != 0) {
			log.error("EntityImage.applyColor(): Failed to grab pixels for mech image. ImageObserver aborted."); //$NON-NLS-1$
			return image;
		}

		if (useCamo) {
			PixelGrabber pgCamo = new PixelGrabber(camo, 0, 0, IMG_WIDTH, IMG_HEIGHT, pCamo, 0, IMG_WIDTH);
			try {
				pgCamo.grabPixels();
			} catch (InterruptedException e) {
				log.error("EntityImage.applyColor(): Failed to grab pixels for camo image." + e.getMessage()); //$NON-NLS-1$
				return image;
			}
			if ((pgCamo.getStatus() & ImageObserver.ABORT) != 0) {
				log.error("EntityImage.applyColor(): Failed to grab pixels for camo image. ImageObserver aborted."); //$NON-NLS-1$
				return image;
			}
		}

		for (int i = 0; i < IMG_SIZE; i++) {
			int pixel = pMech[i];
			int alpha = (pixel >> 24) & 0xff;

			if (alpha != 0) {
				float red1 = 0f
				float green1 = 0f
				float blue1 = 0f
				
				if(useCamo) {
					int pixel1 = pCamo[i]
					red1 = ((float) ((pixel1 >> 16) & 0xff)) / 255
					green1 = ((float) ((pixel1 >> 8) & 0xff)) / 255
					blue1 = ((float) ((pixel1) & 0xff)) / 255
				}
				else {
					red1 = ((float) tint[0]) / 255
					green1 = ((float) tint[1]) / 255
					blue1 = ((float) tint[2]) / 255
				}
				
				float black = ((pMech[i]) & 0xff);

				int red2 = Math.round(red1 * black);
				int green2 = Math.round(green1 * black);
				int blue2 = Math.round(blue1 * black);
				
				pMech[i] = (alpha << 24) | (red2 << 16) | (green2 << 8) | blue2;
			}
		}

		image = parent.createImage(new MemoryImageSource(IMG_WIDTH, IMG_HEIGHT, pMech, 0, IMG_WIDTH));
			
		return EntityImage.toBufferedImage(image);
	}
	
	/**
	 * Converts a given Image into a BufferedImage
	 *
	 * @param img The Image to be converted
	 * @return The converted BufferedImage
	 */
	public static BufferedImage toBufferedImage(Image img)
	{
		if (img instanceof BufferedImage)
		{
			return (BufferedImage) img;
		}
	
		// Create a buffered image with transparency
		BufferedImage bimage = new BufferedImage(img.getWidth(null), img.getHeight(null), BufferedImage.TYPE_INT_ARGB);
	
		// Draw the image on to the buffered image
		Graphics2D bGr = bimage.createGraphics();
		bGr.drawImage(img, 0, 0, null);
		bGr.dispose();
	
		// Return the buffered image
		return bimage;
	}
}
