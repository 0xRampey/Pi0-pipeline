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
var face_bucket = storage.bucket('languagelearning-17d88.appspot.com');
var object_bucket = storage.bucket()

// Upload a local file to a new file to be created in your bucket.

function FirebaseManager(dispatcher){
   this.dispatcher = dispatcher;
   this.dispatcher.subscribe('faceUpload', this.faceUpload);
   this.dispatcher.subscribe('objectUpload', this.objectUpload);
   console.log("Shoudl be inited", this.imageUpload)
}

FirebaseManager.prototype = {

    faceUpload: function(event, fileName){
      console.log("faceUpload")
      bucket.upload(fileName, { destination: "faceDetection/"+fileName }function (err, file) {
        if (err) {
          return console.log(err);
        }
        console.log('Upload finished');

      });
      bucket.upload('python/src/face-filenames.txt', function (err, file) {
        if (err) {
          return console.log(err);
        }
        console.log('face txt upload finished');

      });
    }
    objectUpload : function (event, fileName) {
      console.log("objectUpload")
      bucket.upload(fileName,{ destination: "objectDetection/"+fileName } function (err, file) {
        if (err) {
          return console.log(err);
        }
        console.log('Upload finished');

      });
      bucket.upload('python/src/object-filenames.txt', function (err, file) {
        if (err) {
          return console.log(err);
        }
        console.log('object txt upload finished');

      });
      
    }
  }


module.exports = FirebaseManager;
