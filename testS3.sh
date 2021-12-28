rm -f test3.las

# download pivot file
curl -o testS3_PivotTHREE.json http://lidarhd.pocgpf.ovh/data/metadata/pivotTHREE.json

# Test base on this URL
# lidarhd.pocgpf.ovh:3000/points/823366.71/823410.21/6321240.85/6321288.31?poly=823366.71_6321248.35,823371.18_6321288.31,823410.21_6321277.92,823404.63_6321240.85,823366.71_6321248.35
curl -L -o test3.las http://localhost:3000/points?poly=823366.71_6321248.35,823371.18_6321288.31,823410.21_6321277.92,823404.63_6321240.85,823366.71_6321248.35

if [ -f "test3.las" ];then
	ls -lah test3.las
#	cloudcompare.CloudCompare test3.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare test3.las
else
	echo "LAS file does not exist : test3.las";
fi
