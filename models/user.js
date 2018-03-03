var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");
var friends = require("mongoose-friends");
// let mongooseFieldEncryption = require('mongoose-field-encryption').fieldEncryption;

var UserSchema = new mongoose.Schema({

  email: { type: String, unique: true, lowercase: true },
  phoneNumber: { type: Number, unique: true, lowercase: true },
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
  histories: [{ type: mongoose.Schema.Types.ObjectId, ref: "History", date: Date }],
  openFor: [String],
  donatedAmount: Number,
  receivedAmount: Number,
  lastDonationDate: Number,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  active: false
  
});


UserSchema.plugin(passportMongoose, {
  selectFields: 'email username password phoneNumber firstName lastName bloodType location dob address city country postcode gender [] openFor[] donatedAmount receivedAmount'
});

// UserSchema.plugin(mongooseFieldEncryption, {fields: ['gender', 'lastName','firstName','[]',  'openFor',  'donatedAmount', 'receivedAmount', 'lastDonationDate', 'histories', 'dob', 'phoneNumber', 'email', ], secret: 'vusala'});

UserSchema.plugin(friends({pathName: "myCustomPath"}));


module.exports = mongoose.model("User", UserSchema);