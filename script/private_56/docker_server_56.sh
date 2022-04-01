export CONFIG_FILE=`pwd`/config/private_56.json
export DEBUG_COLORS=true
export DEBUG=point*

cd docker
./build.sh
cd ..

docker run --rm -it --network=host \
-v $HOME/.s3cfg:/root/.s3cfg \
-v $CONFIG_FILE:/root/config.json \
-e CONFIG_FILE=/root/config.json \
-v /media/store-idi1/guillaume/:/media/store-idi1/guillaume/ \
-e DEBUG_COLORS=$DEBUG_COLORS \
-e DEBUG=$DEBUG \
-p 3000:3000 \
pointserver
