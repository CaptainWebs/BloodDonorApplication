var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");

var CenterSchema = new mongoose.Schema({

  city: {type: String, index: true},
  address: String,
  postcode: String,
  phone: String,
  fax: String,
  latitude: String,
  longitude: String
  
});

module.exports = mongoose.model("Center", CenterSchema);