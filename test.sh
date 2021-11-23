rm -f pipeline.json 
rm -f output.las

# coordonnees d'un eglise au sud de Vanne

# erreur 1 : pas de polygon 
curl http://localhost:3000/points/271113/271161/6734674/6734717 

# erreur 2 : pas assez de points dans le polygon
curl http://localhost:3000/points/271113/271161/6734674/6734717?poly=271113_6734674,271113_6734717

# erreur 3 : not number 1
# curl http://localhost:3000/points/271113/271161/6734674/6734717?poly=a_b,c_d,e_f

# ok : invalid ring
curl http://localhost:3000/points/271113/271161/6734674/6734717?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674

# ok
time curl http://localhost:3000/points/271113/271161/6734674/6734717?poly=271113_6734674,271113_6734717,271161_6734717,271161_6734674,271113_6734674
if [ -f "output.las" ];then
	ls -lah output.las
#	cloudcompare.CloudCompare output.las > /dev/null 2>&1
	echo cloudcompare.CloudCompare output.las
else
	echo "LAS file does not exist : output.las";
fi

