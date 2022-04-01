# this test does 4 request in parallel, that takes 2 sec each => last 10 secondes now, based on test2
./node_modules/loadtest/bin/loadtest.js -c 4 -n 100 http://localhost:3000/points?poly=277294.11_6734822.65,277283.24_6734830.58,277296.17_6734851.33,277317.21_6734849.19,277314.84_6734834.41,277301.77_6734835.10,277294.11_6734822.65
