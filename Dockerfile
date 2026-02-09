# -----------------------
# 1) Base image
# -----------------------
FROM node:18

# -----------------------
# 2) Create app folder
# -----------------------
WORKDIR /app

# -----------------------
# 3) Copy app source code (includes node_modules if not ignored)
# -----------------------
COPY . .

# -----------------------
# 4) Expose backend port
# -----------------------
EXPOSE 80

# -----------------------
# 5) Start the backend
# -----------------------
CMD ["node", "server.js"]