var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");

var HistorySchema = new mongoose.Schema({

  donor:
  {
      id:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
     },
     
     username: String
      
  },
  
  date: Date,
  donationName: String,
  type: String
  
});

module.exports = mongoose.model("History", HistorySchema);