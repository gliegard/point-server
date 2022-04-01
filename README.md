# point-server
point-server is a server use to extract pointcloud data.

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


### test

En local, configuration simple :

```
./script/unit_test1.sh
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
