package roguemek

import grails.test.mixin.TestFor
import spock.lang.Specification

/**
 * See the API for {@link grails.test.mixin.web.ControllerUnitTestMixin} for usage instructions
 */
@TestFor(RogueMekController)
class RogueMekControllerSpec extends Specification {

    def setup() {
    }

    def cleanup() {
    }

    void "test something"() {
		controller.index()
		expect:
			'Welcome to RogueMek!' == response.text
    }
}
