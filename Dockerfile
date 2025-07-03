# Dockerfile for your Discord Bot (ARM64v8 for Raspberry Pi)
FROM arm64v8/node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY index.js ./

# .env file is not copied directly into the Docker image for security reasons.
# Instead, environment variables should be passed during container runtime.
CMD [ "node", "index.js" ]