FROM node:14.17.6

WORKDIR /waivio/waivio-cron-service
COPY package.json /waivio/waivio-cron-service

RUN npm install
COPY . .
RUN npm run build
EXPOSE 7599


CMD ["npm", "run", "start:prod"]
