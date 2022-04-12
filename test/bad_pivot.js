const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);
const app = require('../app');
const config = require('../services/config.js')

var conf = config.getFirst();

describe('API /point with bad pivot config', () => {

  before(function() {

    if (process.env.COVERAGE) {
      config.loadJson("./config/test/bad_pivot.json")
      conf = config.getFirst();
    }
    if (conf == undefined) {
      console.log('Skipping because there is no config')
      this.skip();
    }
    if (conf.PIVOT_THREEJS != "./non_existing_pivot_file.json") {
      console.log('Skipping regarding conf.PIVOT_THREEJS, actual is ' + conf.PIVOT_THREEJS + " , and should be ./non_existing_pivot_file.json")
      this.skip();
    }
  })

  it('it should return 500', (done) => {
    chai.request(app)
    .get('/points?poly=791940.71_6272225.14,791941.60_6272227.37,791935.63_6272228.62,791935.72_6272225.76')
    .end((err, res) => {
      should.equal(err, null);
      res.should.have.status(500);
      done();
    });
  });
});
