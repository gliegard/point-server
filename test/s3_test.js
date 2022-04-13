const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);
const app = require('../app');
const config = require('../services/config.js')
var conf;
let SOURCE=""
var request1="";

describe('API /points with, but it returns an URL of an S3 store', () => {

    before(function() {

        // force config for test coverage
        if (process.env.COVERAGE) {
            config.loadJson("./config/unit_test.json")
        }
        if (process.env.TEST_MULTI_SOURCE) {
            SOURCE="&source=foret";
            conf = config.getConfig("foret")
        } else {
            conf = config.getFirst();
        }
        if (conf == undefined) {
            console.log('Skipping because there is no config')
            this.skip();
        }
        // verfiy compatible config
        if (!conf.EPT_JSON || !conf.EPT_JSON.includes('http://lidarhd')) {
            console.log('Skipping somes tests, regarding env var EPT_JSON. actual is: ' + conf.EPT_JSON + ' and should be ept://http://lidarhd...')
            this.skip();
        }
        if (! conf.RETURN_URL === true) {
            console.log('Skipping somes tests, regarding env var RETURN_URL. actual is: ' + conf.RETURN_URL + ' and should be true')
            this.skip();
        }
        if (conf.SURFACE_MAX > 0 && conf.SURFACE_MAX < 3000) {
            console.log('Skipping the test, regarding SURFACE_MAX. actual is: ' + conf.SURFACE_MAX + ' and should be undefined or >= 3000')
            this.skip();
        }
        //const poly = '?poly=823366.71_6321248.35,823371.18_6321288.31,823410.21_6321277.92,823404.63_6321240.85,823366.71_6321248.35'
        const poly  = '?poly=823469.36_6321255.60,823459.31_6321258.96,823461.25_6321267.75,823471.71_6321264.01'
        request1 = '/points' + poly + SOURCE;
    });

    it('it should return 202...', (done) => {
        let data = '';
        chai.request(app)
            .get(request1)
            .end((err, res) => {
                should.equal(err, null);
                res.should.have.status(202);
                done();
            });
    }).timeout(5000);

    it('... wait 5 sec', (done) => {
        setTimeout(done, 5000);
    }).timeout(10000);

    it('it should return 302, and redirect to the S3 store', (done) => {
        chai.request(app)
            .get(request1)
            .redirects(0)
            .end((err, res) => {
                should.equal(err, null);
                console.log('res.text : ' + res.text);
                res.should.have.status(302);
                res.headers.should.have.property('location');
                console.log('header location: ' + res.headers.location);
                res.headers.location.should.include('http://lidarhd');
                // res.headers.location.should.include('0a675093245f496d81593922552e3e91/lidar_x_823366_y_6321240.las');
                res.headers.location.should.include('82056977489ea3d046589653a4c0aa94/lidar_x_823459_y_6321255.las');
                done();
            });

    });

});
