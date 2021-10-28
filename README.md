# point-server
point-server is a server use to extract pointcloud data.

## to do

- Multiple requests in parallel
  - Test : How to test multiple request ?
  - Use npx + mp2 to manage parallel request
  - Avoid creating same pipeline name for each request, create unique id tmp file


- Configurable Entwine folder to serve

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
