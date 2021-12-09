# point-server
point-server is a server use to extract pointcloud data.

## to do

- Release (start with 0.1.1)

- Test EPT qui utilise S3

- Avoid return result in the request, just return the download URL
  - New request -> hash -> filename_s3
  - if the filename_s3 already exists, return the download URL
  - otherwise
    - compute the Las file with PDAL
    - upload the Las file on the S3 folder
    - return the download URL


- Disposability https://12factor.net/fr/disposability
  - use queue worker

- Dev/Prod : continuous deployment

- Tests : 
  - test existing code with unit tests, at least functionnal tests for errors


- Fast api (equivalent Python mde nodeJS)

- Base de code
  - une autre base pour l'integration continue
  - une autre pour le deploiement

## to do (bonus)

- EPSG input/out parameter. Now it's lamb93 hard coded
  - for the request
  - for the output

- Allow itown planar mode (means serve point cloud in a Non geocentric proj)
  - Use other pipeline template file

- Doc for every mode (planar, geocentric, which folder to serve, polygone mode or not)


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