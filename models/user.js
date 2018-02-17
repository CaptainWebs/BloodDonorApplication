var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({

  email: String,
  phoneNumber: Number,
  firstName: String,
  lastName: String,
  bloodType: String,
  username: String,
  password: String,
  location: String,
  dob: Date,
  address: String,
  country: String,
  city: String,
  postcode: String,
  gender: String,
  histories: [{ type: mongoose.Schema.Types.ObjectId, ref: "History", default: []}],
  openFor: [String],
  donatedAmount: Number,
  receivedAmount: Number
  
});


UserSchema.plugin(passportMongoose, {
  selectFields: 'email username password phoneNumber firstName lastName bloodType location dob address city country postcode gender [] openFor[] donatedAmount receivedAmount'
});


module.exports = mongoose.model("User", UserSchema);