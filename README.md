# heimerdinger

heimerdinger is a small application that collects, persists, and visualizes data accessed through the League of Legends API using [d3.js](http://d3js.org/).

### Install
You will need at least node.js including [npm](https://nodejs.org/), and a running postgreSQL instance.
You can download postgreSQL [here](http://www.postgresql.org/download/). Create a postgreSQL instance at localhost, using the standard port 5433. You will need the database schema. You can download it using this [link]

Clone this repository and go into its local directory. Add your API KEY to your .bashrc or .bash_profile using the following command: 
```
  export API_KEY=<<YOUR_API_KEY>>
```
Run the following commands:
```
  npm install -g grunt-cli
  npm install -g bower
  npm install pg
  npm install basic-logger
  npm install
  bower install
```
After that, you should be able to start the server using the following command, which starts the backend server: 
```
node src/server/server.js
```
If it is up and running, you can start the client, which connects to the backend and retrieves data through it:
```
grunt serve
```
The client starts your browser and shows the data. 
The experience is best using chrome. Especially the Internet Explorer does not work properly with SVG.
