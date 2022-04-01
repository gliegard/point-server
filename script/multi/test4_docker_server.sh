export CONFIG_FILE=./config/unit_test.json
export DEBUG_COLORS=true
export DEBUG=point*

cd docker
./build2.sh
cd ..

docker run --rm -it --network=host \
-v $HOME/.s3cfg:/root/.s3cfg \
-e CONFIG_FILE=$CONFIG_FILE \
-e DEBUG_COLORS=$DEBUG_COLORS \
-e DEBUG=$DEBUG \
-p 3000:3000 \
pointserver2
