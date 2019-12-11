// start with node app.js

const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio');
const mqtt = require('mqtt');
const config = require('../Config13318/config.json');
const Kep13318 = require('./Kep13318');
const Sproc13318 = require('./Sproc13318');

// Initialize a Feathers app
const app = feathers();
// Configure Socket.io real-time APIs
app.configure(socketio());
// Register an in-memory messages service
app.use('/Kep13318', new Kep13318.Service());
// Register an in-memory messages service
app.use('/Sproc13318', new Sproc13318.Service());

// Register a nicer error handler than the default Express one
//app.use(express.errorHandler());

// Add any new real-time connection to the `everybody` channel
app.on('connection', connection => app.channel('everybody').join(connection));
// Publish all events to the `everybody` channel
app.publish(data => app.channel('everybody'));

// Start the server
app
  .listen(config.BPGServicesPort)
  .on('listening', () =>
    console.log(`BPGServices listening on ${config.BPGServicesPort}`),
  );

// For good measure let's create a message
// So our API doesn't look so empty
app.service('Kep13318').create({
  text: 'Hello world from the server',
});
// For good measure let's create a message
// So our API doesn't look so empty
app.service('Sproc13318').create({
  text: 'Hello world from the server',
});

let mqttClient = mqtt.connect(config.MQTT);

mqttClient.on('connect', function() {
  mqttClient.subscribe('Kep13318', function(err) {
    if (!err) {
      console.log('BPGServices subscribed to: Kep13318');
    }
  });
  mqttClient.subscribe('Sproc13318', function(err) {
    if (!err) {
      console.log('BPGServices subscribed to: Sproc13318');
    }
  });

});
// message is a buffer
mqttClient.on('message', function(topic, message) {
  const p = JSON.parse(message.toString()); // payload is a buffer
  console.log(p);
  console.log(`Topic is: ${topic}`);
  let msg;
  if('Kep13318'==topic){
    console.log("Kep13318 message")
    msg = `${p.TransDate}, Work Center: ${p.WorkCenter},${p.NodeId},${p.Cycle_Counter_Shift_SL}`;
    app.service('Kep13318').create({
      text: msg,
    });
  }
  if('Sproc13318'==topic){
    console.log(`Sproc13318 message => ${message}`)
    // msg = `${p.TransDate}, ${p.Part_No},${p.Serial_No},${p.ProdServer},${p.Quantity},${p.Container_Status}`;
    app.service('Sproc13318').create({
       text: p,
    });
  }
//  console.log(msg);
});
