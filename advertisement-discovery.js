var noble = require('noble');
var async = require('async');
var fs = require('fs');

// Keep a list of known peripherals
known_peripherals = ['OnePlus 3']

// Heartbeat rate
service_list = [ '180d' ]

DATA_DIRECTORY = './Recorded_data/'

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log("Scanning started!")
    noble.startScanning();
  } else {
    console.log("Scanning stopped!")
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {

  if( known_peripherals.includes(peripheral.advertisement.localName) )
  {
    console.log("Found a known peripheral!")
    noble.stopScanning();
    console.log('peripheral discovered (' + peripheral.id +
              ' with address <' + peripheral.address +  ', ' + peripheral.addressType + '>,' +
              ' connectable ' + peripheral.connectable + ',' +
              ' RSSI ' + peripheral.rssi + ':');
    console.log('\thello my local name is:');
    console.log('\t\t' + peripheral.advertisement.localName);
  
  console.log('\tcan I interest you in any of the following advertised services:');
  console.log('\t\t' + JSON.stringify(peripheral.advertisement.serviceUuids));

  var serviceData = peripheral.advertisement.serviceData;
  if (serviceData && serviceData.length) {
    console.log('\there is my service data:');
    for (var i in serviceData) {
      console.log('\t\t' + JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
    }
  }
  if (peripheral.advertisement.manufacturerData) {
    console.log('\there is my manufacturer data:');
    console.log('\t\t' + JSON.stringify(peripheral.advertisement.manufacturerData.toString('hex')));
  }
  if (peripheral.advertisement.txPowerLevel !== undefined) {
    console.log('\tmy TX power level is:');
    console.log('\t\t' + peripheral.advertisement.txPowerLevel);
  }

  console.log();

  extract_data(peripheral)
}
});

function extract_data(peripheral) {

  peripheral.on('disconnect', function() {
    console.log("Peripheral disconnected!")
    process.exit(0);
  });

  peripheral.connect(function(error) {

    peripheral.discoverServices(service_list, function(err, services) {
      var serviceIndex = 0;

      async.whilst(
        function () {
          return (serviceIndex < services.length);
        },
        function(callback) {
          var service = services[serviceIndex];
          var serviceInfo = service.uuid;

          // This must be the service we were looking for.
          // Lets setup a timestamp to mark the moment this service data
          // was accessed

          // Timestamp has a 1-second resolution right now
          timestamp = (new Date()).toLocaleString();

          // Let's also take the opportunity to setup a folder for this service
          // if it isn't already there

          service_folder = DATA_DIRECTORY + service.name


          // One-time synchronous operation for each service encountered
          if (!fs.existsSync(service_folder)){
            fs.mkdirSync(service_folder);
          }

          service.discoverCharacteristics([], function(error, characteristics) {
            var characteristicIndex = 0;

            async.whilst(
              function () {
                return (characteristicIndex < characteristics.length);
              },
              function(callback) {
                var characteristic = characteristics[characteristicIndex];
                var characteristicInfo = '  ' + characteristic.uuid;

                char_folder = service_folder + '/' + characteristic.name

                // One-time synchronous operation for each characteristic encountered
                if (!fs.existsSync(char_folder)){
                  fs.mkdirSync(char_folder);
                }

                async.series([
                  function(callback) {

                    if (characteristic.properties.indexOf('read') !== -1) {
                      characteristic.read(function(error, data) {
                        if (data) {
                          file_path = char_folder + '/' + timestamp
                          var string = data.toString('hex');
                          writeToDisk(string, file_path)
                        }
                        callback();
                      });
                    } else {
                      callback();
                    }
                  },
                  function() {
                    console.log(characteristicInfo);
                    characteristicIndex++;
                    callback();
                  }
                ]);
              },
              function(error) {
                serviceIndex++;
                callback();
              }
            );
          });
        },
        function (err) {
          peripheral.disconnect();
        }
      );
    });
  });
}


function writeToDisk(data, file_path) {

  var wstream = fs.createWriteStream(file_path);
  wstream.on('finish', function () {
    console.log( file_path +' has been written');
  });
  wstream.write(data);
  wstream.end();

}

function explore(peripheral) {
  console.log('services and characteristics:');

  peripheral.on('disconnect', function() {
    process.exit(0);
  });

  peripheral.connect(function(error) {
    peripheral.discoverServices([], function(error, services) {
      var serviceIndex = 0;

      async.whilst(
        function () {
          return (serviceIndex < services.length);
        },
        function(callback) {
          var service = services[serviceIndex];
          var serviceInfo = service.uuid;

          if (service.name) {
            serviceInfo += ' (' + service.name + ')';
          }
          console.log(serviceInfo);

          service.discoverCharacteristics([], function(error, characteristics) {
            var characteristicIndex = 0;

            async.whilst(
              function () {
                return (characteristicIndex < characteristics.length);
              },
              function(callback) {
                var characteristic = characteristics[characteristicIndex];
                var characteristicInfo = '  ' + characteristic.uuid;

                if (characteristic.name) {
                  characteristicInfo += ' (' + characteristic.name + ')';
                }

                async.series([
                  function(callback) {
                    characteristic.discoverDescriptors(function(error, descriptors) {
                      async.detect(
                        descriptors,
                        function(descriptor, callback) {
                          if (descriptor.uuid === '2901') {
                            return callback(descriptor);
                          } else {
                            return callback();
                          }
                        },
                        function(userDescriptionDescriptor){
                          if (userDescriptionDescriptor) {
                            userDescriptionDescriptor.readValue(function(error, data) {
                              if (data) {
                                characteristicInfo += ' (' + data.toString() + ')';
                              }
                              callback();
                            });
                          } else {
                            callback();
                          }
                        }
                      );
                    });
                  },
                  function(callback) {
                        characteristicInfo += '\n    properties  ' + characteristic.properties.join(', ');

                    if (characteristic.properties.indexOf('read') !== -1) {
                      characteristic.read(function(error, data) {
                        if (data) {
                          var string = data.toString('ascii');

                          characteristicInfo += '\n    value       ' + data.toString('hex') + ' | \'' + string + '\'';
                        }
                        callback();
                      });
                    } else {
                      callback();
                    }
                  },
                  function() {
                    console.log(characteristicInfo);
                    characteristicIndex++;
                    callback();
                  }
                ]);
              },
              function(error) {
                serviceIndex++;
                callback();
              }
            );
          });
        },
        function (err) {
          peripheral.disconnect();
        }
      );
    });
  });
}




