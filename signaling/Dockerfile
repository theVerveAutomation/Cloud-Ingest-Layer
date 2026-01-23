FROM node:20-alpine

WORKDIR /app
# Copy package.json and lockfile, install dependencies
COPY package*.json ./
RUN npm install --production

# Copy application files into the image
COPY . .

EXPOSE 3000

CMD ["npm", "start"]