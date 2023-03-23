FROM node:16.15-alpine

WORKDIR /code

COPY ./package.json /code/package.json

RUN npm install

COPY . /code/

ENV PORT=8000
ENV DB_PATH=./db/faucet.db
ENV SENDER_PREFIX=bonus
ENV TX_AMOUNT=10000000
ENV TX_DENOM=ubonus
ENV FEE_GAS=200000
ENV FEE_AMOUNT=1000
ENV FEE_DENOM=ubonus
ENV LIMIT_PER_ADDRESS=1
ENV LIMIT_PER_IP=100

EXPOSE 8000

CMD ["node", "--es-module-specifier-resolution=node", "main.js"]
