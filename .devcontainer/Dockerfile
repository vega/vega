FROM node:12

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies for Vega
RUN apt-get update \
  && apt-get install -y bash yarn build-essential libcairo2-dev libpango1.0-dev librsvg2-dev rsync

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=
