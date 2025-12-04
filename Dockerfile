# -----------------------
# 1) Base image
# -----------------------
FROM node:18-alpine

# -----------------------
# 2) Create app folder
# -----------------------
WORKDIR /app

# -----------------------
# 3) Copy package files
# -----------------------
COPY package*.json ./

# -----------------------
# 4) Install dependencies
# -----------------------
RUN npm install

# -----------------------
# 5) Copy app source code
# -----------------------
COPY . .

# -----------------------
# 6) Expose backend port
# -----------------------
EXPOSE 4000

# -----------------------
# 7) Start the backend
# -----------------------
CMD ["node", "server.js"]
