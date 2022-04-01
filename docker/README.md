Les dependaces de ce projets sont :
- nodejs
- pdal
- s3cmd

Le fichier Dockerfile et ./build.sh
- part d'une Debain
- utilise nvm pour obtenir la version LTS de node
- produit une image de 700 Mo


Le fichier Dockerfile2 et ./build2.sh
- part d'une image plus lourde contenant nodeJs en version LTS, et d'autres outils de dev (git, curl..)
- le fichier Dockerfile est plus simple
- mais produit une image deux fois plus lourde 1.2 Go
- Fonctionne avec Node v16.13.1