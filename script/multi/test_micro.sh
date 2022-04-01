rm -f micro.las

# micro test, very fast
time curl -o micro.las http://localhost:3000/points?source=micro\&poly=791940.71_6272225.14,791941.60_6272227.37,791935.63_6272228.62,791935.72_6272225.76
if [ -f "micro.las" ];then
	ls -lah micro.las
#	cloudcompare.CloudCompare micro.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare micro.las
else
	echo "LAS file does not exist : micro.las";
fi
