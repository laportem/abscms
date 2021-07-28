# ** Build Stage **
FROM node:14-alpine

# ** Environment Settings **
ENV PORT 1337
ENV HOST 0.0.0.0
ENV NODE_ENV production

# Set Image Labels
LABEL org.opencontainers.image.title="CMS Application part of the Seychelles ABS Platform" \
      org.opencontainers.image.description="The CMS component part of the Seychelles ABS Platform." \
      org.opencontainers.image.source="https://github.com/laportem/abscms.git" \
      org.opencontainers.image.authors="Manny Laporte (mannylaporte@gmail.com)"

# Create app directory and switch to it
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy both 'package.json' and 'package-lock.json' to ./app
COPY package*.json /usr/src/app

# Install project dependencies in 'package.json'
RUN npm install

# Copy project files and folders to the current working directory ./app
COPY . /usr/src/app

# Build app for production
RUN npm run build

# ** Run CMS Application **
EXPOSE 1337
CMD ["npm", "run", "start"]