FROM node:20-bullseye-slim as base

ENV NODE_PATH=/node_modules
ENV PATH=$PATH:/node_modules/.bin

WORKDIR /app

COPY .npmrc .
COPY package.json .
COPY package-lock.json .

FROM base as dev
RUN npm install

FROM dev as test

FROM dev as docs

FROM dev as examples
