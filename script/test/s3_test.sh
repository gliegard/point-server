#!/bin/bash
export CONFIG_FILE=./config/foret.json
export DEBUG_COLORS=true
export DEBUG=point*,store*
#export AWS_ENDPOINT='s3.gra.cloud.ovh.net'
npm test
