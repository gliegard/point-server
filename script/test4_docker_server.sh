export EPT_JSON=ept://http://lidarhd.pocgpf.ovh/data_test/lot7/blocs/NP/EPT_4978/ept.json
export PIVOT_THREEJS=/root/testS3_Nimes_pivotTHREE.json
export SURFACE_MAX=100000
export STORE_READ_URL=http://lidarhd.pocgpf.ovh/tmp
export STORE_WRITE_URL=s3://lidarhd/tmp
export DEBUG_COLORS=true
export DEBUG=point*

cd docker
./build2.sh
cd ..

curl -o testS3_Nimes_pivotTHREE.json http://lidarhd.pocgpf.ovh/data_test/lot7/blocs/NP/metadata/pivotTHREE.json

docker run --rm -it --network=host \
-v $HOME/.s3cfg:/root/.s3cfg \
-v `pwd`/testS3_Nimes_pivotTHREE.json:/root/testS3_Nimes_pivotTHREE.json \
-e EPT_JSON=$EPT_JSON \
-e PIVOT_THREEJS=$PIVOT_THREEJS \
-e SURFACE_MAX=$SURFACE_MAX \
-e STORE_READ_URL=$STORE_READ_URL \
-e STORE_WRITE_URL=$STORE_WRITE_URL \
-e DEBUG_COLORS=$DEBUG_COLORS \
-e DEBUG=$DEBUG \
-p 3000:3000 \
pointserver2
