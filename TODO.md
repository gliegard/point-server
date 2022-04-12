- Return_202 when request is accepted
  - before calling pdal : return status 202 to tell the user to wait
  - and store the information on disk or S3, file hash.process
  - then the client do the same request, same response
  - then the client do the same request, reponse with the final response

- Test all possible error:
  - polygon with bad coordinate (ex poly=a,b,c) throw exception in extract method that kills the server
    - manage exception thrown
  - non existing pivot file
  - non existing ept file -> make pdal error
  - non existing store -> make S3CMD error

- Write log for S3CMD and PDAL errors

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
  
