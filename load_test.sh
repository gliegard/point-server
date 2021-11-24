# this test does 4 request in parallel, that takes 2 sec each.
./node_modules/loadtest/bin/loadtest.js -c 4 -n 4 http://localhost:3000/points?poly=269941.67_6733355.02,269941.67_6733355.02,270147.35_6733352.49,270153.64_6733554.66,269949.30_6733555.73
