FROM mhart/alpine-node
MAINTAINER Shinichi SUGIYAMA <shin.sugi@gmail.com>
RUN apk add --no-cache git
RUN mkdir -p /var/www
ADD package.json webpack.config.js /var/www/
ADD index.js /var/www/
ADD lib /var/www/lib
ADD views /var/www/views
ADD src /var/www/src
WORKDIR /var/www
RUN npm install
RUN npm run build-cli
RUN npm run build-svr
ADD assets public/
EXPOSE 3000
CMD [ "npm", "start" ]
