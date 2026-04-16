FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p uploads

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
