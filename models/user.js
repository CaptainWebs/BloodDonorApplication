var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({

  title: String,
  first_name: String,
  last_name: String,
  gender: String,
  ethnicity: String,
  landline_phone_number: Number,
  mobile_phone_number: Number,
  date_of_birth: String,
  address:{
  
     city: String,
     country: String,
     postcode: String
  
  },
  
  blood_type: String,
  blood_donor_id: String,
  mother_language: String
});

module.exports = mongoose.model("User", userSchema);