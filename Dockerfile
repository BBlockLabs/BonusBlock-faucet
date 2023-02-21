FROM node:16.15

WORKDIR /code

COPY ./package.json /code/package.json
COPY ./package-lock.json /code/package-lock.json

RUN npm ci

COPY . /code/

CMD ["node", "--es-module-specifier-resolution=node", "main.js"]