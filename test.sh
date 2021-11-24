rm -f pipeline.json 
rm -f output.las

# coordonnees d'un eglise au sud de Vanne

# bad request 1 : pas de polygon 
curl http://localhost:3000/points

# bad request 2 : pas assez de points dans le polygon
curl http://localhost:3000/points?poly=271113_6734674,271113_6734717

# bad request  3 : not number 1
# curl http://localhost:3000/points?poly=a_b,c_d,e_f

# bad request 4 : car virgule à la fin ; 
# curl http://localhost:3000/points?poly=271035.28_6734865.93,271049.87_6734859.83,271046.29_6734849.37,271033.00_6734854.20,
# bad request  5 : car virgule à la fin ; 
# curl http://localhost:3000/points?poly=,271035.28_6734865.93,271049.87_6734859.83,271046.29_6734849.37,271033.00_6734854.20

# ok : invalid ring
curl http://localhost:3000/points?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674


# ok : test 100 m² (10m * 10) (26 sec in local)
curl http://localhost:3000/points?poly=272445.89_6734885.43,272445.89_6734885.43,272455.89_6734885.22,272456.57_6734896.03,272446.03_6734895.63

# ok : test 4000 m² (200m * 200m ) (150 sec in local)
curl http://localhost:3000/points?poly=269941.67_6733355.02,269941.67_6733355.02,270147.35_6733352.49,270153.64_6733554.66,269949.30_6733555.73

# bad request (limit) test 100 000m² (200m * 500) (132 sec)
curl http://localhost:3000/points?poly=277325.41_6735421.07,277325.41_6735421.07,277528.66_6735409.07,277515.99_6734905.15,277314.67_6734918.59 

# bad request (limit) : test 250 000m² (500m * 500) (130 sec)
curl http://localhost:3000/points?poly=276347.84_6735102.06,276347.84_6735102.06,276847.11_6735106.73,276835.63_6734604.85,276334.31_6734594.83 

# ok
time curl http://localhost:3000/points?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674,271113_6734674
if [ -f "output.las" ];then
	ls -lah output.las
#	cloudcompare.CloudCompare output.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare output.las
else
	echo "LAS file does not exist : output.las";
fi

