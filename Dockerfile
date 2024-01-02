#Stage 1 : Build Stage 
FROM node:18 AS bhulder 

#set the working directory in container to /app 
WORKDIR /app

#copy package.json and package-lock.json into the working directory
COPY package*.json ./ 

# install any needed package specified in package.json
RUN npm install 

# Bundle app source inside the docker image 
COPY . . 

# Build the app 
RUN npm run build 



# Stage 2: production stage 
FROM node:18 

# Install ffmpeg in the container 
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory 
WORKDIR /app

# Copy package.json and package-lock.json 
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production 

# copy built app from  the builder stage 
COPY --from=builder /app/dist ./dist

# make port 3000 avialable to the world outside this container lol 
EXPOSE 3000

# Define the commands to run your app using CMD which defines your runtime 
CMD ["npm", "run", "serve"]