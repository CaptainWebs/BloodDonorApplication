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
  nameOfTheReceiver: String,
  typeOfDonation: String
  
});

HistorySchema.plugin(passportMongoose, {
  selectFields: 'donor date nameOfTheReceiver typeOfDonation'
});

module.exports = mongoose.model("History", HistorySchema);