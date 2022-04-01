const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
chai.use(chaiHttp);
const app = require('../app');
const config = require('../services/config.js')

var assert = require('assert');
var fs = require('fs');

describe('API /point without any config', () => {

    before(function() {

      if (process.env.COVERAGE) {
        config.loadJson("./config/empty.json")
      }
      var conf = config.getFirst();
      if (conf != undefined) {
        console.log('Skipping the no config test, config should be "undefined" and is actually ' + conf);
        this.skip()
      }
    })
  
    it('it should return 400', (done) => {
      chai.request(app)
      .get('/points')
      .end((err, res) => {
        should.equal(err, null);
        res.should.have.status(400);
        res.text.should.contain('Bad config: there is not any config');
        done();
      });
    });
});

describe('API /point with bad source param', () => {

  it('it should return 400', (done) => {
    chai.request(app)
    .get('/points?source=Non_existing_source')
    .end((err, res) => {
      should.equal(err, null);
      res.should.have.status(400);
      res.text.should.contain('Bad config for source Non_existing_source');
      done();
    });
  });
});

var CONFIG_UNIT_TEST = "config/unit_test.json";
var CONFIG_MICRO = "config/micro.json";

describe('Config unit tests', function () {

  describe('#loadJson()', function () {
    it('should read a config file', function () {
    
        config.loadJson(CONFIG_UNIT_TEST);

        assert(config.getConfig("micro").EPT_JSON == "./data/micro/EPT_4978/ept.json");
        assert(config.getConfig("Nimes").EPT_JSON.includes("http://lidarhd.pocgpf.ovh/data_test/lot7/blocs/NP/EPT_4978/ept.json"));
    });
  });

    
  describe('#getFirst()', function () {
        it('should return first config file', function () {
        
            config.loadJson(CONFIG_MICRO);
            assert(config.getFirst().EPT_JSON == "./data/micro/EPT_4978/ept.json");
            
        });
  });

});
