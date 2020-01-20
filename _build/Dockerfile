# Use the standard Amazon Linux base, provided by ECR/KaOS
# It points to the standard shared Amazon Linux image, with a versioned tag.
FROM amazonlinux:2
LABEL maintainer="jkahn"

# Framework versions
ENV VERSION_NODE_10=10.16.0
ENV VERSION_NODE_12=12
ENV VERSION_NODE_DEFAULT=$VERSION_NODE_10
ENV VERSION_RUBY_2_5=2.5.0
ENV VERSION_BUNDLER=2.1.2
ENV VERSION_RUBY_DEFAULT=$VERSION_RUBY_2_5
ENV VERSION_AMPLIFY=4.12.0

# UTF-8 Environment
ENV LANGUAGE en_US:en
ENV LANG=en_US.UTF-8
ENV LC_ALL en_US.UTF-8

## Install OS packages
RUN touch ~/.bashrc
RUN yum -y update && \
    yum -y install \
        alsa-lib-devel \
        autoconf \
        automake \
        bzip2 \
        bison \
        bzr \
        cmake \
        expect \
        fontconfig \
        git \
        gcc-c++ \
        GConf2-devel \
        gtk2-devel \
        gtk3-devel \
        jq \
        libnotify-devel \
        libpng \
        libpng-devel \
        libffi-devel \
        libtool \
        libX11 \
        libXext \
        libxml2 \
        libxml2-devel \
        libXScrnSaver \
        libxslt \
        libxslt-devel \
        libyaml \
        libyaml-devel \
        nss-devel \
        openssl-devel \
        openssh-clients \
        patch \
        procps \
        python3 \
        python3-devel \
        readline-devel \
        sqlite-devel \
        tar \
        tree \
        unzip \
        wget \
        which \
        xorg-x11-server-Xvfb \
        zip \
        zlib \
        zlib-devel \
    yum clean all && \
    rm -rf /var/cache/yum

## Install Node 10 & 12
RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.2/install.sh | bash
RUN /bin/bash -c ". ~/.nvm/nvm.sh && \
	nvm install $VERSION_NODE_10 && nvm use $VERSION_NODE_10 && \
	nvm install $VERSION_NODE_12 && nvm use $VERSION_NODE_12 && \
	nvm alias default node && nvm cache clear"

## Install Ruby 2.5.0 - this is the version used by Lambda
RUN gpg --keyserver hkp://pool.sks-keyservers.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB && \
	curl -sL https://get.rvm.io | bash -s -- --with-gems="bundler"
#RUN curl -sL https://get.rvm.io | bash -s -- --with-gems="bundler"

ENV PATH /usr/local/rvm/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
RUN /bin/bash --login -c "\
	rvm install $VERSION_RUBY_2_5 && rvm use $VERSION_RUBY_2_5 --default && gem install bundler -v $VERSION_BUNDLER && \
	rvm cleanup all"

## Install awscli
RUN /bin/bash -c "pip3 install --upgrade --user awscli && rm -rf /var/cache/apk/*"

## Install SAM CLI
RUN /bin/bash -c "pip3 install --upgrade --user aws-sam-cli cfn-lint"

## Install AWS Amplify CLI for VERSION_NODE_DEFAULT
RUN /bin/bash -c ". ~/.nvm/nvm.sh && nvm use ${VERSION_NODE_DEFAULT} && \
	npm install -g @aws-amplify/cli@${VERSION_AMPLIFY}"

## Environment Setup
ENV NODE_PATH /root/.nvm/v${VERSION_NODE_DEFAULT}/lib/node_modules
ENV PATH /root/.nvm/versions/node/v${VERSION_NODE_DEFAULT}/bin:/usr/local/rvm/bin:/root/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH

RUN echo "rvm use ${VERSION_RUBY_DEFAULT} --default 1> /dev/null" >> ~/.bashrc

ENTRYPOINT [ "bash", "-l", "-c" ]
