Les dependaces de ce projets sont :
- nodejs
- pdal
- s3cmd

Le fichier Dockerfile et ./build.sh
- part d'une Debian 11
- utilise nvm pour obtenir la version LTS de node
- produit une image de 700 Mo


Le fichier Dockerfile2 et ./build2.sh
- part d'une image plus lourde contenant nodeJs en version LTS, et d'autres outils de dev (git, curl..)
- le fichier Dockerfile est plus simple
- mais produit une image deux fois plus lourde 1.2 Go
- Fonctionne avec Node v16.13.1


Le fichier Dockerfile3 et ./build3.sh
- part d'une Debian 10
- télécharge, compile, et installe les librairies dans une version choisie
- utilise la dernière version de Node & NPM
- produit une image de 2.26 Go (dont 1.1 Go pour le layer de GDAL)
