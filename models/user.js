var mongoose = require("mongoose");

var userSchema = new mongoose.Schema({

  first_name: String,
  last_name: String,
  date_of_birth: String,
  address:{
  
     city: String,
     country: String,
     postcode: String
  
  },
  
  blood_type: String,
  mother_language: String
});

module.exports = mongoose.model("User", userSchema);