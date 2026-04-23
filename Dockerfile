FROM node:18

WORKDIR /app

COPY . .

EXPOSE 80

CMD ["node", "server.js"]