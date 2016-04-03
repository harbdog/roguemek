package roguemek



import static org.springframework.http.HttpStatus.*
import grails.transaction.Transactional
import grails.plugin.springsecurity.annotation.Secured

import org.apache.commons.io.IOUtils
import org.codehaus.groovy.grails.web.servlet.mvc.GrailsParameterMap;

import roguemek.model.Mech

@Transactional(readOnly = true)
class MechController {

    static allowedMethods = [save: "POST", update: "PUT", delete: "DELETE"]
	
	/*def beforeInterceptor = {
		log.info "Request from country: "+request.locale.country
	}*/
	
	/*def afterInterceptor =  { model ->
		log.info "$actionName: $model"
	}*/
	

    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)
		params.sort = params.sort ?: "name"
		params.order = params.order ?: "asc"
		
        respond Mech.list(params), model:[mechInstanceCount: Mech.count()]
    }

    def show(Mech mechInstance) {
		if(mechInstance == null) {
			redirect action: 'index'
		}
		else {
			respond mechInstance
		}
    }
	
	def showMech() {
		def chassisToSearchFor = params.chassis
		def variantToSearchFor = params.variant
		
		def mechInstance = Mech.findByChassisAndVariant(chassisToSearchFor, variantToSearchFor)
		
		if(mechInstance) {
			respond mechInstance
		}
		else {
			redirect action: 'index'
		}
	}

    def create() {
        respond new Mech(params)
    }
	
	def upload() {
		def requestFile = request.getFile('mtfFile')
		
		StringBuffer mtfText = new StringBuffer()
		
		if(requestFile && !requestFile.empty && requestFile.size < 10240) {
			log.info("Incoming file name: "+requestFile.getOriginalFilename())
			
			StringWriter writer = new StringWriter()
			IOUtils.copy(requestFile.getInputStream(), writer)
			mtfText.append(writer.toString().replaceAll("\n", "<BR/>"))
			
			/* The example below is for creating and reading Files on the server
			 * instead of just reading the InputeStream
			 */
			/*
			def mtfFile = File.createTempFile(requestFile.getOriginalFilename(), null)
			requestFile.transferTo(mtfFile)
			
			BufferedReader br = new BufferedReader(new FileReader(mtfFile))
			String line = null
			while ((line = br.readLine()) != null) {
				mtfText.append(line + "<br/>")
			}
			
			mtfFile.delete()
			*/
		}
		else {
			mtfText.append("File is empty or not appropriate for this application.")
		}
		
		render mtfText
	}

    @Transactional
    def save(MechCreateCommand mechCmd) {
		if(mechCmd.validate()) {
			def mech = mechCmd.createMech(params)
			mech.save flush:true
			redirect action: 'show', id: mech.id
		}
		else {
			render view: 'create', model:[mechCmd:mechCmd]
		}
		
        /*if (mechInstance == null) {
            notFound()
            return
        }
		
		log.info("Mech params: " + params.toString())

        if (mechInstance.hasErrors()) {
            respond mechInstance.errors, view:'create'
            return
        }

        mechInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.created.message', args: [message(code: 'mech.label', default: 'Mech'), mechInstance.id])
                redirect mechInstance
            }
            '*' { respond mechInstance, [status: CREATED] }
        }*/
    }

    def edit(Mech mechInstance) {
        respond mechInstance
    }

    @Transactional
    def update(Mech mechInstance) {
        if (mechInstance == null) {
            notFound()
            return
        }

        if (mechInstance.hasErrors()) {
            respond mechInstance.errors, view:'edit'
            return
        }

        mechInstance.save flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.updated.message', args: [message(code: 'Mech.label', default: 'Mech'), mechInstance.id])
                redirect mechInstance
            }
            '*'{ respond mechInstance, [status: OK] }
        }
    }

    @Transactional
    def delete(Mech mechInstance) {

        if (mechInstance == null) {
            notFound()
            return
        }

        mechInstance.delete flush:true

        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.deleted.message', args: [message(code: 'Mech.label', default: 'Mech'), mechInstance.id])
                redirect action:"index", method:"GET"
            }
            '*'{ render status: NO_CONTENT }
        }
    }

    protected void notFound() {
        request.withFormat {
            form multipartForm {
                flash.message = message(code: 'default.not.found.message', args: [message(code: 'mech.label', default: 'Mech'), params.id])
                redirect action: "index", method: "GET"
            }
            '*'{ render status: NOT_FOUND }
        }
    }
}

@grails.validation.Validateable
class MechCreateCommand {
	// Configuration properties
	String name
	String description
	String chassis
	String variant
	
	int tonnage
	
	static constraints = {
		importFrom Mech
	}
	
	Mech createMech(GrailsParameterMap params) {
		def armor = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
		def internals = [0, 0, 0, 0, 0, 0, 0, 0]
		
		params.armor = armor
		params.internals = internals
		
		def mech = new Mech(params)
		
		return mech
	}
}
