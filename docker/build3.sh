proc=$(nproc)
if [ "$proc" -eq 1 ]; then
  jobs=1
else
  jobs=$((3 * proc / 4))
fi
docker build --network=host --build-arg http_proxy=http://proxy.ign.fr:3128/ --build-arg make_jobs=$jobs -t pointserver3 -f Dockerfile3 .
