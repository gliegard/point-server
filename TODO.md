- Config file with Docker
  - Make the tests work

- Verif config :
  - Loading config : Check undefined value for needed config

- Config test file for
  - ept file not found
  - pivot file not found
  - bad store read url
  - bad store write url

- Health
  - show PDAL version
  - show S3CMD version
  - Check config file existence

- Upload the Las file on the S3 folder using a library https://www.npmjs.com/package/s3
    - Now it's S3CMD sub process

- 12 factor app : https://12factor.net/fr/
  - Disposability : Verify graceful shutdown use.

- S3 : Actual behavior stores the date in a directory on the s3 store (s3store/date/uid/file). Make this behavior optional. Can be useful if we have a bucket configured to delete automatically the file after a delay

- EPSG input/out parameter. Now it's lamb93 hard coded
  - for the request
  - for the output

- Allow itown planar mode (means serve point cloud in a Non geocentric proj)
  - Use other pipeline template file