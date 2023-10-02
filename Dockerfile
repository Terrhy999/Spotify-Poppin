FROM node:18-alpine

WORKDIR /home/node/app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 8889
CMD npm start
