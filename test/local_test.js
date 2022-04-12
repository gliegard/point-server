const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);
const app = require('../app');

const config = require('../services/config.js')
var conf;

describe('API /points with env local', () => {

    before(function() {
        if (process.env.COVERAGE) {
            config.loadJson("./config/unit_test.json")
        }
        if (process.env.TEST_MULTI_SOURCE) {
            SOURCE="&source=micro";
            conf = config.getConfig("micro")
        } else {
            conf = config.getFirst();
        }
        if (conf == undefined) {
            console.log('Skipping because there is no config')
            this.skip();
        }
        if (!conf.EPT_JSON.includes('micro')) {
            console.log('Skipping somes tests, regarding EPT_JSON. actual is: ' + conf.EPT_JSON + ' and should be ./data/micro/EPT_4978/ept.json.')
            this.skip();
        }
        if (!conf.PIVOT_THREEJS.includes('micro')) {
            console.log('Skipping somes tests, regarding PIVOT_THREEJS. actual is: ' + conf.PIVOT_THREEJS + ' and should be ./data/micro/metadata/pivotTHREE.json.')
            this.skip();
        }
        if (conf.RETURN_URL) {
            console.log('Skipping somes tests, regarding RETURN_URL. actual is: ' + conf.RETURN_URL + ' and should be false')
            this.skip();
        }
    });

    describe('Test that extract a pointcloud !', () => {
        
        before(function() {
            if (conf.SURFACE_MAX > 0 && conf.SURFACE_MAX < 3000) {
                console.log('Skipping the test, regarding SURFACE_MAX. actual is: ' + conf.SURFACE_MAX + ' and should be undefined of >= 3000')
                this.skip();
            }
        })

        it('it should return 200, and download the file', (done) => {
            let data = '';
            chai.request(app)
                .get('/points?poly=791940.71_6272225.14,791941.60_6272227.37,791935.63_6272228.62,791935.72_6272225.76')
                .buffer()
                .parse((res, callback) => {
                    res.setEncoding('binary');
                    res.on('data', function (chunk) {
                        data += chunk;
                    });
                    res.on('end', function () {
                        callback(null, Buffer.from(data, 'binary'));
                    })
                })
                .end((err, res) => {
                    should.equal(err, null);
                    // if you want to debug, comment the lines before (buffer and parse methods)
                    console.log('res.text : ' + res.text);
                    res.should.have.status(200);
                    res.header['content-length'].should.be.equal('10903');
                    res.body.length.should.be.equal(10903);
                    console.log('body length: ' + res.body.length)
                    done();

                    // to verifie the expected size, download it, verifiy it, and print the size
                    // const size = require('fs').statSync('lidar_x_271113_y_6734674.las').size.toString();
                    // console.log('expected size regarding file size on disk: ' + size);
                });

        })

    });

/*
    describe('!! PERFORMANCE TEST !! can be very long, test PDAL point extraction, regarding big area', () => {

        before(function() {
            if (!process.env.SURFACE_MAX || process.env.SURFACE_MAX != 0) {
                console.log('Skipping perf tests, regarding SURFACE_MAX. actual is: ' + process.env.SURFACE_MAX + ' and should be 0')
                this.skip();
            }
        })

        function test_perf(done, status, query) {

            chai.request(app)
            .get(query)
            .end((err, res) => {
                should.equal(err, null);
                res.should.have.status(status);
                done();
            });
        }

        it('it should return 200: test perf 1: test 100 m² (10m * 10) (26 sec)', done => { test_perf(done, 200, '/points?poly=272445.89_6734885.43,272445.89_6734885.43,272455.89_6734885.22,272456.57_6734896.03,272446.03_6734895.63')});
        it('it should return 200: test perf 2: test 4000 m² (200m * 200m ) (150 sec)', done => { test_perf(done, 200, '/points?poly=269941.67_6733355.02,269941.67_6733355.02,270147.35_6733352.49,270153.64_6733554.66,269949.30_6733555.73')}).timeout(10000);
        it('it should return 200: test perf 3: test 100 000m² (200m * 500) (132 sec)', done => { test_perf(done, 200, '/points?poly=277325.41_6735421.07,277325.41_6735421.07,277528.66_6735409.07,277515.99_6734905.15,277314.67_6734918.5')}).timeout(10000);;
        it('it should return 200: test perf 4: test 250 000m² (500m * 500) (130 sec)', done => { test_perf(done, 200, '/points?poly=276347.84_6735102.06,276347.84_6735102.06,276847.11_6735106.73,276835.63_6734604.85,276334.31_6734594.83')}).timeout(60000);;
    });
*/
});
