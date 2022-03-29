FROM debian:latest

ENV http_proxy ${http_proxy}
ENV https_proxy ${http_proxy}

ENV TZ=Europe/Moscow
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -y && apt-get install --no-install-recommends -y \
s3cmd npm git pdal curl \
&& apt-get -y autoclean

# update npm
RUN npm config set http-proxy $http_proxy
RUN npm config set https-proxy $http_proxy
RUN npm install -g npm

# install nvm, to have node LTS version
SHELL ["/bin/bash", "--login", "-c"]
ENV NVM_DIR /usr/local/nvm
RUN mkdir -p /usr/local/nvm
RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
RUN source $NVM_DIR/nvm.sh \
    && nvm install --lts

RUN git config --global http.proxy $http_proxy
RUN git clone https://github.com/gliegard/point-server.git

WORKDIR /point-server

RUN mkdir tmp
RUN npm install

EXPOSE 3000

CMD [ "npm", "run", "dev" ]