// Require gcloud
const {Storage} = require('@google-cloud/storage');
var fs = require('fs');
var path = require( 'path' );

var moveFrom = "/home/pi/NotPushedToWifi";
var moveTo = "/home/pi/PushedToWifi";

// Enable Storage
const storage = new Storage({
  projectId: 'languagelearning-17d88',
  keyFilename: '/home/pi/languagelearning-key.json'
});


// Reference an existing bucket.
var bucket = storage.bucket('languagelearning-17d88.appspot.com');

// Upload a local file to a new file to be created in your bucket.
var data = process.argv.slice(2);

function FirebaseManger(dispatcher){
   this.dispatcher = dispatcher;
   this.dispatcher.subscribe('imageUpload', this.imageUpload);
   function imageUpload(event, fileName){
     bucket.upload(fileName, function(err, file) {
     if (err) {
        return console.log(err);
      }
     });
     console.log('Upload finished');
   }
}



module.exports = FirebaseManger;
