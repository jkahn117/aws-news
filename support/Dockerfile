FROM amazonlinux:2

SHELL [ "/bin/bash", "--login", "-c" ]

ENV NODE_VERSION=12.18.0
ENV RUBY_VERSION=2.7.0

# Amplify Console requires Curl, Git, OpenSSL
RUN touch ~/.bashrc
RUN yum -y update && \
    yum -y install \
        curl \
        git \
        jq \
        openssl \
        procps \
        python3 \
        tar \
        which \
    yum clean all && \
    rm -rf /var/cache/yum

# Install Node.js, NPM, and Yarn
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash && \
    . ~/.nvm/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use default && \
    nvm cache clear && \
    npm install -g yarn

# Install Ruby
RUN gpg --keyserver hkp://pool.sks-keyservers.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB && \
    curl -sSL https://get.rvm.io | bash
ENV PATH /usr/local/rvm/bin:/root/.nvm/versions/node/v${NODE_VERSION}/bin:/root/.yarn/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
RUN rvm install $RUBY_VERSION && \
    rvm use $RUBY_VERSION --default && \
    rvm cleanup all

# Install build tools
RUN npm install -g @aws-amplify/cli && \
    pip3 install awscli && rm -rf /var/cache/apk/* && \
    pip3 install aws-sam-cli

ENTRYPOINT [ "/bin/bash", "--login", "-c" ]
