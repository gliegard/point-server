rm -f test5_arbre.las

# Test base on this URL
curl -L -o test5_arbre.las http://localhost:3000/points?source=foret\&poly=823368.63_6321282.08,823409.26_6321280.44,823402.24_6321237.12,823353.32_6321256.31

if [ -f "test5_arbre.las" ];then
	ls -lah test5_arbre.las
#	cloudcompare.CloudCompare test5_arbre.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare test5_arbre.las
else
	echo "LAS file does not exist : test5_arbre.las";
fi
