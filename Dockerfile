# Stage 1: Build stage
FROM node:16-alpine AS build

# Install Python3 and build tools
RUN apk add --no-cache python3 make g++ yarn

WORKDIR /usr/app

# Copy package and lock files for caching purposes
COPY package.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN yarn install

# Copy the entire project
COPY . .

# Build the project
RUN pnpm build

# Stage 2: Final runtime stage
FROM node:16-alpine

# Install Python3 and youtube-dl
RUN apk add --no-cache python3 && \
    python3 -m ensurepip && \
    pip3 install --no-cache --upgrade youtube-dl

WORKDIR /usr/app

# Copy the built output and dependencies from the build stage
COPY --from=build /usr/app/node_modules ./node_modules
COPY --from=build /usr/app/dist ./dist
COPY --from=build /usr/app/package.json ./package.json

# Default command
CMD ["sh", "-c", "TARGET_URL=$TARGET_URL pnpm start && python3 -m youtube_dl \"$LINK\" -o output.mp4"]
