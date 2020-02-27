#!/bin/bash

bundle install --path=. --without test

rm -rf ruby/2.7.0/cache && ruby -rf ruby/2.7.0/bin

mkdir ruby/gems

mv ruby/2.7.0 ruby/gems

zip -r dependencies.zip ./ruby/

rm -rf .bundle/

rm -rf ./ruby
