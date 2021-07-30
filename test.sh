rm -f pipeline.json 
rm -f output.las

# coordonnees d'un eglise au sud de Vanne
curl http://localhost:3000/points/271113/271161/6734674/6734717 

if [ -f "output.las" ];then
	ls -lah output.las
#	cloudcompare.CloudCompare output.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare output.las
else
	echo "LAS file does not exist : output.las";
fi

