// Require gcloud
var gcloud = require('@google-cloud/storage');
var fs = require('fs');
var path = require( 'path' );

var moveFrom = "/home/pi/NotPushedToWifi";
var moveTo = "/home/pi/PushedToWifi"

// Enable Storage
var gcs = gcloud({
  projectId: 'languagelearning-17d88',
  keyFilename: '/home/pi/languagelearning-key.json'
});

// Reference an existing bucket.
var bucket = gcs.bucket('languagelearning-17d88.appspot.com');

// Upload a local file to a new file to be created in your bucket.
var data = process.argv.slice(2);

function FirebaseManger(dispatcher){
   dispatcher.subscribe('imageUpload', fileName)
   function imageUpload(){
     bucket.upload(fileName, function(err, file) {
     if (err) {
        return console.log(err);
      }
     });
     console.log('Upload finished');
   }

}

module.exports = FirebaseManger
