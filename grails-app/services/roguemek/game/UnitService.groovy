package roguemek.game

import grails.transaction.Transactional

import roguemek.model.*
import roguemek.assets.ContextHelper

@Transactional
class UnitService {

	public static String imagesExtension = "gif"
	
	private static String imagesBasePath = "units/mechs/"
	
    /**
	 * Used to determine the image to be used for the unit
	 * @param mech
	 * @return
	 */
	public String getUnitImagePath(Unit unit) {
		String mechImage = "";
		
		if(unit instanceof Mech) {
			Mech mech = unit
			
			// If no specific image found, use a default based on the mech's weight class
			String weightClass = mech.getWeightClass()
			mechImage = "default_"+ weightClass +"."+imagesExtension
			
			// using all lowercase and no spaces for base mech name
			String mechName = mech.name.toLowerCase().replaceAll(" ", "")
			String variant = mech.variant.toLowerCase()
			
			def imageNameList = [
				"${mechName}_${variant}",		// match by "name_variant.gif"
				"${mechName}"					// match by "name.gif"
			]
			
			for(String imageName in imageNameList) {
				try{
					String testImage = imageName + "."+imagesExtension
					InputStream imageFile = ContextHelper.getContextAsset("images/"+imagesBasePath + testImage)
				
					log.debug("testImage:"+testImage+", available="+imageFile.available())
					if(imageFile.available()) {
						mechImage = testImage
						break;
					}
				} catch(Exception e) {
					// this image not found, move on to the next
				}
			}
		}
		
		return imagesBasePath + mechImage
	}
}
