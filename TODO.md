- Serve multiple EPT

- Config with anv var:
  - remove default value, verify config, and throw exception
  - default behavior must be the most simple : send file in the response

- Upload the Las file on the S3 folder using a library https://www.npmjs.com/package/s3
    - Now it's with system call of aws cli.

- 12 factor app : https://12factor.net/fr/
  - Disposability : Verify graceful shutdown use.

- Env var to avoid using date in store path to store on S3 storage. Can be useful if we have a bucket configured to delete automatically the file after a delay

- EPSG input/out parameter. Now it's lamb93 hard coded
  - for the request
  - for the output

- Allow itown planar mode (means serve point cloud in a Non geocentric proj)
  - Use other pipeline template file