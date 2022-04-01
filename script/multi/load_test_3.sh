# this test does 4 request in parallel, that takes 2 sec each => last 10 secondes now, based on test2
./node_modules/loadtest/bin/loadtest.js -c 4 -n 100 http://localhost:3000/points?source=micro\&poly=791940.71_6272225.14,791941.60_6272227.37,791935.63_6272228.62,791935.72_6272225.76
