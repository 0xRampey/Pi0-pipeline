var noble = require('noble');
var async = require('async');

// Keep a list of known peripherals
known_peripherals = ['OnePlus 3']

service_list = [ '180d' ]

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
  console.log(service_list)
}
});

function extract_data(peripheral) {

  peripheral.on('disconnect', function() {
    console.log("Peripheral disconnected!")
    process.exit(0);
  });

  peripheral.connect(function(error) {

    peripheral.discoverServices(service_list, function(err, services) {


      console.log("Total no of services ", services.length)
      services.forEach(function(service) {
        //
        // This must be the service we were looking for.
        //
        console.log('found service:', service.uuid);

        //
        // So, discover its characteristics.
        //
        service.discoverCharacteristics([], function(err, characteristics) {

          characteristics.forEach(function(characteristic) {
            //
            // Loop through each characteristic and match them to the
            // UUIDs that we know about.
            //
            console.log('found characteristic:', characteristic.uuid);

            
          })
        })
      })
    })
  })
}

function explore(peripheral) {
  console.log('services and characteristics:');

  peripheral.on('disconnect', function() {
    console.log("Peripheral disconnected!")
    process.exit(0);
  });

  peripheral.connect(function(error) {
    console.log("Connecting to device....")
    peripheral.discoverServices([], function(error, services) {
      console.log("Discovering services....")
      var serviceIndex = 0;
      console.log("Total no of services ", services.length)

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
                  // This function is to pick out the descriptors in each characteristic
                  // function(callback) {
                  //   characteristic.discoverDescriptors(function(error, descriptors) {
                  //     async.detect(
                  //       // Detect the first desciptor which matches the UUID of 2901
                  //       descriptors,
                  //       function(descriptor, callback) {
                  //         if (descriptor.uuid === '2901') {
                  //           return callback(descriptor);
                  //         } else {
                  //           return callback();
                  //         }
                  //       },
                  //       function(userDescriptionDescriptor){
                  //         if (userDescriptionDescriptor) {
                  //           userDescriptionDescriptor.readValue(function(error, data) {
                  //             if (data) {
                  //               characteristicInfo += ' (' + data.toString() + ')';
                  //             }
                  //             callback();
                  //           });
                  //         } else {
                  //           callback();
                  //         }
                  //       }
                  //     );
                  //   });
                  // },
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


