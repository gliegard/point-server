rm -f test3_pont.las

# Test base on this URL
curl -L -o test3_pont.las http://localhost:3000/points?source=Nimes\&poly=832635.44_6300138.31,833038.28_6300099.99,833025.63_6300031.70,832641.96_6300072.44

if [ -f "test3_pont.las" ];then
	ls -lah test3_pont.las
#	cloudcompare.CloudCompare test3_pont.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare test3_pont.las
else
	echo "LAS file does not exist : test3_pont.las";
fi
