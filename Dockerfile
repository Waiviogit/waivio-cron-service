FROM node:16.0.0-alpine3.12

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install
COPY . .
RUN npm run build

CMD ["npm", "run", "start:prod"]
