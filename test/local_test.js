const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const should = chai.should();
chai.use(chaiHttp);

// const fs = require('fs');


describe('API /points with env local', () => {

    before(function() {
        if (process.env.EPT_JSON != '/media/data/EPT_SUD_Vannes/EPT_4978/ept.json') {
            console.log('Skipping somes tests, regarding EPT_JSON. actual is: ' + process.env.EPT_JSON + ' and should be /media/data...')
            this.skip();
        }
        if (!process.env.RETURN_URL || process.env.RETURN_URL == 'true') {
            console.log('Skipping somes tests, regarding RETURN_URL. actual is: ' + process.env.RETURN_URL + ' and should be false')
            this.skip();
        }
    });

    describe('Test that extract a pointcloud !', () => {
        
        before(function() {
            if (process.env.SURFACE_MAX > 0 && process.env.SURFACE_MAX < 3000) {
                console.log('Skipping the test, regarding SURFACE_MAX. actual is: ' + process.env.SURFACE_MAX + ' and should be undefined of >= 3000')
                this.skip();
            }
        })

        it('it should return 200, and download the file', (done) => {
            let data = '';
            chai.request(app)
                .get('/points?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674')
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
                    res.should.have.status(200);
                    res.header['content-length'].should.be.equal('1204195');
                    res.body.length.should.be.equal(1204195);
                    console.log('body length: ' + res.body.length)
                    done();

                    // to verifie the expected size, download it, verifiy it, and print the size
                    // const size = fs.statSync('lidar_x_271113_y_6734674.las').size.toString();
                    // console.log('expected size regarding file size on disk: ' + size);
                });

        });

    });


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

});
