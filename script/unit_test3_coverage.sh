#!/bin/bash
export TEST_MULTI_SOURCE=true
export COVERAGE=true
export CONFIG_FILE=./config/unit_test.json
npm run coverage
