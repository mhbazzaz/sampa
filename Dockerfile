FROM docker.secuscope.iranet.net/node:20.16.0-alpine3.20

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app

RUN npm install --registry=https://sonatype.secuscope.iranet.net/repository/npm-proxy/

COPY . /app

RUN npm run build

CMD ["npm", "run", "start"]