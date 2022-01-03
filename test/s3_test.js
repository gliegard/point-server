const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const should = chai.should();
chai.use(chaiHttp);


describe('API /points with, but it returns an URL of an S3 store', () => {

    before(function() {
        if (!process.env.EPT_JSON || !process.env.EPT_JSON.includes('ept://http://lidarhd')) {
            console.log('Skipping somes tests, regarding env var EPT_JSON. actual is: ' + process.env.EPT_JSON + ' and should be ept://http://lidarhd...')
            this.skip();
        }
        if (process.env.RETURN_URL && process.env.RETURN_URL != 'true') {
            console.log('Skipping somes tests, regarding env var RETURN_URL. actual is: ' + process.env.RETURN_URL + ' and should be true')
            this.skip();
        }
    });

    describe('Test that extract a pointcloud !', () => {
        
        before(function() {
            if (process.env.SURFACE_MAX > 0 && process.env.SURFACE_MAX < 3000) {
                console.log('Skipping the test, regarding SURFACE_MAX. actual is: ' + process.env.SURFACE_MAX + ' and should be undefined or >= 3000')
                this.skip();
            }
        })

        function test_s3() {
            return it('it should return 302, and redirect to the S3 store', (done) => {
                let data = '';
                chai.request(app)
                    .get('/points?poly=823366.71_6321248.35,823371.18_6321288.31,823410.21_6321277.92,823404.63_6321240.85,823366.71_6321248.35')
                    .redirects(0)
                    .end((err, res) => {
                        should.equal(err, null);
                        res.should.have.status(302);
                        res.headers.should.have.property('location');
                        console.log('header location: ' + res.headers.location);
                        res.headers.location.should.include('http://lidarhd');
                        res.headers.location.should.include('0a675093245f496d81593922552e3e91/lidar_x_823366_y_6321240.las');
                        done();
                    });
    
            });
    
        }

        // first time, the request is longuer because it must create and put the file on the S3 store
        test_s3().timeout(20000);
        // second time, the same request should be fast, because the file exist on the store.
        test_s3();
    });

});
