FROM ubuntu:bionic

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get update \
  && apt-get install -y curl build-essential libssl-dev

ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 12

# Install NVM
RUN mkdir /usr/local/nvm \
  && curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash \
  && source $NVM_DIR/nvm.sh \
  && nvm install $NODE_VERSION \
  && nvm alias default $NODE_VERSION \
  && nvm use default

# Install dependencies for Vega
RUN apt-get update \
  && apt-get install -y libcairo2-dev libpango1.0-dev librsvg2-dev rsync
