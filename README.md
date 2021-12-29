# point-server
point-server is a server use to extract pointcloud data.

## to do

- Config with anv var:
  - remove default value, verify config, and throw exception
  - default behavior must be the most simple : send file in the response

- Tests :
  - return url S3 config

- Make this repo public

- continuous deployment
  - Create a Docker file
  - Create another git project to make deployment

- Upload the Las file on the S3 folder using a library https://www.npmjs.com/package/s3
    - Now it's with system call of aws cli.

- 12 factor app : https://12factor.net/fr/
  - Disposability : Verify graceful shutdown use.

- Env var to avoid using date in store path to store on S3 storage. Can be useful if we have a bucket configured to delete automatically the file after a delay


## to do (bonus)

- EPSG input/out parameter. Now it's lamb93 hard coded
  - for the request
  - for the output

- Allow itown planar mode (means serve point cloud in a Non geocentric proj)
  - Use other pipeline template file


## get started


### install 

Assume that you have installed in your system :

 - Anaconda
 - NodeJs


```
conda env create -f environment.yml
npm install
```

### run

```
conda activate point-server
npm start
```


### run inside screen (terminal multiplexer)

Start new screen session

```
screen -S point_server_running

```

Then run the server
```
conda activate point-server
npm run dev
```

Detach the session, so you can exit the terminal, and the server is still running.
```
Ctr + a, d
```

Verify your session is alive, listing all sessions with :

```
screen -ls
```

Re attach your terminal to a session
```
screen -r point_server_running
```

## request on the server

Download a pointcloud, with curl : 
```
curl http://localhost:3000/points?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674
```
And open it with cloudCompare :
```
cloudcompare.CloudCompare output.las
```
