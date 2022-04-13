const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);
const app = require('../app');
const config = require('../services/config.js')

var conf = config.getConfig("micro")


describe('API /health', () => {
  it('it should return 200', (done) => {
    chai.request(app)
      .get('/health')
      .end((err, res) => {
        should.equal(err, null);
        res.should.have.status(200);
        done();
      });
  });
});


describe('API /points about polygon parameter', () => {

  before(function() {
    if (conf == undefined) {
      console.log('Skipping because there is no config')
      this.skip();
    }
  })

  describe('API /points without polygon parameter', () => {
    it('it should return 400 and a json body with id BAD_REQUEST_NO_POLYGON', (done) => {
      chai.request(app)
        .get('/points')
        .end((err, res) => {
          should.equal(err, null);
          res.should.have.status(400);
          res.should.be.json;
          res.body.id.should.equal('BAD_REQUEST_NO_POLYGON');
          done();
        });
    });
  });

  describe('API /points with bad polygon made of 2 points', () => {
    it('it should return 400 a json body with id BAD_REQUEST_BAD_POLYGON', (done) => {
      chai.request(app)
        .get('/points?poly=271113_6734674,271113_6734717')
        .end((err, res) => {
          should.equal(err, null);
          res.should.have.status(400);
          res.should.be.json;
          res.body.id.should.equal('BAD_REQUEST_BAD_POLYGON');
          done();
        });
    });
  });

});


describe('API /points surface reach limit', () => {

  before(function() {
    if (conf == undefined) {
      console.log('Skipping because there is no config')
      this.skip();
    }
    if (conf.SURFACE_MAX && (conf.SURFACE_MAX > 109000 || conf.SURFACE_MAX == 0)) {
        console.log('Skipping suface limit tests, regarding SURFACE_MAX. actual is: ' + conf.SURFACE_MAX + ' and should be undefined or > 0 and < 109 000')
        this.skip();
    }
  })

  it('it should return 400', (done) => {
    chai.request(app)
      .get('/points?poly=277325.41_6735421.07,277325.41_6735421.07,277528.66_6735409.07,277515.99_6734905.15,277314.67_6734918.59')
      .end((err, res) => {
        should.equal(err, null);
        res.should.have.status(400);
        res.should.be.json;
        res.body.id.should.equal('BAD_REQUEST_AREA');
        done();
      });
  });
});
