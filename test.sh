rm -f pipeline.json 
rm -f output.las

# coordonnees d'un eglise au sud de Vanne

# erreur 1 : pas de polygon 
curl http://localhost:3000/points

# erreur 2 : pas assez de points dans le polygon
curl http://localhost:3000/points?poly=271113_6734674,271113_6734717

# erreur 3 : not number 1
# curl http://localhost:3000/points?poly=a_b,c_d,e_f

# erreur 4 : car virgule à la fin ; 
# curl http://localhost:3000/points?poly=271035.28_6734865.93,271049.87_6734859.83,271046.29_6734849.37,271033.00_6734854.20,
# erreur 5 : car virgule à la fin ; 
# curl http://localhost:3000/points?poly=,271035.28_6734865.93,271049.87_6734859.83,271046.29_6734849.37,271033.00_6734854.20

# ok : invalid ring
# curl http://localhost:3000/points?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674


# ok
time curl http://localhost:3000/points?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674,271113_6734674
if [ -f "output.las" ];then
	ls -lah output.las
#	cloudcompare.CloudCompare output.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare output.las
else
	echo "LAS file does not exist : output.las";
fi

