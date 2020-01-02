FROM node:12-alpine

WORKDIR /ust/src/app

COPY . .

RUN yarn install --prod

CMD ["node", "./server.js"]