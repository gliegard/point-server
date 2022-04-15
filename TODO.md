- TODO: nodenv et variable d'env
  - .env pour mettre CONFIG_FILE, et les secret
  - .env dans le gitignore
  - .example.env example sans les secrets
  - module nodenv et l'appeler dnas bin/www

- TODO: - Use NodeCache to prevent user for spamming the same request.
  - This lib should block request if it's the same since 1 second for example.
  - https://www.npmjs.com/package/node-cache

- Log: Use Log4JS

- route get capabilities pour savoir
Theo - si le EPT_JSON est dans la config (Théo) (permet d'avoir un front qui bouge pas)
  - quelle est la taille max requetable (Madec)

Theo - route pour demander la detection d'un nouveau jeu de donnée, en regardant le server s3

- config default. Mettre une clé default, pour mettre les valeurs par default, pour pas les remettre à chaque fois.

- config in an API, to reload config without restarting the server

- Verify pdal, s3cmd is in the path on startup

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

- Should we use AWS-SDK to upload LAS file on the S3 store ? 
    - Now it's S3CMD sub process

- 12 factor app : https://12factor.net/fr/
  - Disposability : Verify graceful shutdown use.

- S3 : Actual behavior stores the date in a directory on the s3 store (s3store/date/uid/file). Make this behavior optional. Can be useful if we have a bucket configured to delete automatically the file after a delay

- EPSG input/out parameter. Now it's lamb93 hard coded
  - for the request
  - for the output

- Allow itown planar mode (means serve point cloud in a Non geocentric proj)
  - Use other pipeline template file
