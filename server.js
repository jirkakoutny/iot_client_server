'use strict';

// Require
var nconf = require('nconf');
var iotHub = require('azure-event-hubs').Client;
var firebase = require("firebase");
var express = require('express')

// Configuration
nconf.argv().env().file('./config.json');

// Express app
var app = express()
app.get('/notes', function (req, res) {
    res.json({ notes: "This is your notebook. Edit this to start saving your notes!" })
})
app.listen(3001)


// Firebase init
var firebaseConfig = {
    apiKey: nconf.get('firebaseApiKey'),
    databaseURL: nconf.get('firebaseDatabaseURL'),
};
firebase.initializeApp(firebaseConfig);

// IoT Hub init
var iotHubConnString = nconf.get('iotHubConnString');
var iotHubClient = iotHub.fromConnectionString(iotHubConnString);

// Azure D2C Firebase Persistor
iotHubClient.open()
    .then(iotHubClient.getPartitionIds.bind(iotHubClient))
    .then(function (partitionIds) {
        return partitionIds.map(function (partitionId) {
            return iotHubClient.createReceiver('$Default', partitionId, { 'startAfterTime': Date.now() }).then(function (receiver) {
                console.log('Created partition receiver: ' + partitionId)
                receiver.on('errorReceived', printError);
                receiver.on('message', printMessage);
            });
        });
    })
    .catch(printError);

function persistMessage(message) {
    // deviceMessagesNode.push(message);
    deviceMessagesNode.set(message);
};

// Other methods

// Print error
var printError = function (err) {
    console.log(err.message);
};

// Print message
var printMessage = function (message) {
    console.log('Message received: ');
    console.log(JSON.stringify(message.body));
    persistMessage(message.body)
    console.log('');
};
