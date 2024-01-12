#official node runtime as parent image 
FROM node:18

#set the working directory in container to /app 
WORKDIR /app

#copy package.json and package-lock.json into the working directory
COPY package*.json ./

# Install ffmpeg in the container 
RUN apt-get update && apt-get install -y ffmpeg

# Install only production dependencies
RUN npm install 

# Bundle app source inside the docker image 
COPY . . 

# make port 3000 avialable to the world outside this container lol 
EXPOSE 3000

# Define the commands to run your app using CMD which defines your runtime 
CMD ["npm", "start"]