# point-server
point-server is a server use to extract pointcloud data.

## install

Assume that you have installed in your system :

 - Anaconda
 - NodeJs


```
conda env create -f environment.yml
npm install
```

## run

```
conda activate point-server

export CONFIG_FILE=./config/unit_test.json
export DEBUG_COLORS=true
export DEBUG=point*,store*

npm start
```

## test

Unit test, in local :

```
./script/test/local_test.sh
```

## configuration file

You must set environment varible `CONFIG_FILE`; pointing to a configuration file.

This JSON example show a config file with 2 possible usages :
```
{
    "local": {
        "EPT_JSON": "./data/micro/EPT_4978/ept.json",
        "PIVOT_THREEJS": "./data/micro/metadata/pivotTHREE.json",
        "SURFACE_MAX": "50000",
        "RETURN_URL": false
    }
    "configWithS3": {
        "EPT_JSON": "ept://http://url/to/ept.json",
        "PIVOT_THREEJS": "http://url/to/pivotTHREE.json",
        "SURFACE_MAX": 100000,
        "RETURN_URL": true,
        "S3_BUCKET": "lidarhd",
        "S3_TMP_FOLDER": "tmp",
        "REDIRECT_URL": "http://lidarhd.pocgpf.ovh/tmp"
    }
}
```

`EPT_JSON` : PointCloud store in EPT format (Entwine)

`PIVOT_THREEJS` : Special file used to reproject the pointcloud.
It's design to be used with a pointcload created by PointTools project : https://github.com/iTowns/PointsTools

`SURFACE_MAX` : Max area to be extracted in square meter. Bigger area will lead to error 400 ( with id BAD_REQUEST_AREA). 0 means no limit.

`RETURN_URL` : if true : use S3 store to store the file created, and and send redirection as response. Also, when the request comes, send 202 to tell user we accept the request, so the user will have to request the API again to have the responses.

 if false : Send the file in the response. The request hangs while the file is being created.

If RETURN_URL is set to true, you must set these 3 other config elements.

`S3_BUCKET`: S3 Bucket used to store created files.

`S3_TMP_FOLDER`: folder in the S3 store used to store created files.

`REDIRECT_URL`: Visible URL used to redirect the response


## use S3 store

You must set environment variables :

`AWS_SECRET_ACCESS_KEY` : secret access key

`AWS_ACCESS_KEY_ID` : access key id

`AWS_ENDPOINT` : endpoint (default value: s3.gra.cloud.ovh.net)

`http_proxy` : If you are behind a proxy (ex: http://proxy.example.com:3128)


## run inside screen (terminal multiplexer)

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
curl -o output.las localhost:3000/points\?source=micro\&poly\=791940.71_6272225.14,791941.60_6272227.37,791935.63_6272228.62,791935.72_6272225.76
```
And open it with cloudCompare :
```
cloudcompare.CloudCompare output.las
```

`source` refers to one of the config block in the configuration file

`poly` is the polygon to extract; defined like this : x1_y1,x2_y2,x3_y3
