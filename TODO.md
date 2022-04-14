- Test config on startup
  - check pdal in the path
  - should we request pivot file on startup ?

- Test all possible error:
  - non existing ept file -> make pdal error
  - non existing store -> make S3CMD error

- use node-fetch to read file and url easily ?

- polygon param in req.body.poly

- open API
  - express-open-api-validator
  - swagger-ui
  - Client REST : Insomnia

- health
  - check every 30 sec S3 health
  - if S3 is down, block all requests
  - use event emitter

- config in an API, to reload config without restarting the server

- Verif config :
  - Loading config : Check undefined value for needed config

- Config test file for
  - ept file not found
  - pivot file not found
  - bad store read url
  - bad store write url

- Health
  - API version
  - show PDAL version
  - show S3CMD version
  - Check config file existence

- Upload the Las file on the S3 folder using a library https://www.npmjs.com/package/s3 ; or AWS-SDK
    - Now it's S3CMD sub process

- 12 factor app : https://12factor.net/fr/
  - Disposability : Verify graceful shutdown use.

- S3 : Actual behavior stores the date in a directory on the s3 store (s3store/date/uid/file). Make this behavior optional. Can be useful if we have a bucket configured to delete automatically the file after a delay

- EPSG input/out parameter. Now it's lamb93 hard coded
  - for the request
  - for the output

- Allow itown planar mode (means serve point cloud in a Non geocentric proj)
  - Use other pipeline template file
  
