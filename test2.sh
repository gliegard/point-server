rm -f pipeline.json 
rm -f output.las
rm -f test2.las

curl -o test2.las http://localhost:3000/points?poly=277294.11_6734822.65,277283.24_6734830.58,277296.17_6734851.33,277317.21_6734849.19,277314.84_6734834.41,277301.77_6734835.10,277294.11_6734822.65

if [ -f "test2.las" ];then
	ls -lah test2.las
#	cloudcompare.CloudCompare test2.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare test2.las
else
	echo "LAS file does not exist : test2.las";
fi