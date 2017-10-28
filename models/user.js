var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({

  // title: String,
  // first_name: String,
  // last_name: String,
  email: String,
  phoneNumber: Number,
  firstName: String,
  lastName: String,
  bloodType: String,
  username: String,
  password: String,
  // gender: String,
  // ethnicity: String,
  // landline_phone_number: Number,
  // mobile_phone_number: Number,
  // date_of_birth: String,
  // address:{
  
  //   city: String,
  //   country: String,
  //   postcode: String
  
  // },
  
  // blood_type: String,
  // mother_language: String
  
});

UserSchema.plugin(passportMongoose, {
  selectFields: 'email username password phoneNumber firstName lastName bloodType'
});

module.exports = mongoose.model("User", UserSchema);