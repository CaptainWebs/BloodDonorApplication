var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");

var HistorySchema = new mongoose.Schema({

  donor:
  {
      id:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         index: true
     },
     
     username: String
      
  },
  
  date: Date,
  donationName: String,
  type: String,
  comment: String,
  hospitalName: String,
  amount: Number
  
});

module.exports = mongoose.model("History", HistorySchema);