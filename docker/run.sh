export CONFIG_FILE=`pwd`/config.json
echo use config file $CONFIG_FILE

docker run --rm -it --network=host \
-v $HOME/.s3cfg:/root/.s3cfg \
-v $CONFIG_FILE:/root/config.json \
-e CONFIG_FILE=/root/config.json \
-e DEBUG_COLORS=$DEBUG_COLORS \
-e DEBUG=$DEBUG \
-p 3000:3000 \
pointserver
