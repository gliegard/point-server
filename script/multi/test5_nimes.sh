rm -f test5_arene.las

# Test base on this URL
curl -L -o test5_arene.las http://localhost:3000/points?source=nimes\&poly=809291.36_6304885.45,809274.26_6304942.24,809325.87_6304980.18,809394.11_6305002.36,809433.20_6304967.01,809426.92_6304909.18,809368.42_6304869.02,809319.63_6304870.12

if [ -f "test5_arene.las" ];then
	ls -lah test5_arene.las
#	cloudcompare.CloudCompare test5_arene.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare test5_arene.las
else
	echo "LAS file does not exist : test5_arene.las";
fi
