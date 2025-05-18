# Dockerfile for your Discord Bot
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY index.js ./
COPY .env ./ 
CMD [ "node", "index.js" ]