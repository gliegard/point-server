rm -f pipeline.json 
rm -f output.las

# coordonnees d'un eglise au sud de Vanne
time curl http://localhost:3000/points?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674,271113_6734674
if [ -f "output.las" ];then
	ls -lah output.las
#	cloudcompare.CloudCompare output.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare output.las
else
	echo "LAS file does not exist : output.las";
fi

