var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");

var FeedbackSchema = new mongoose.Schema({

  user:
  {
      id:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
     },
     
     username: String
      
  },
  
  profile: String,
  search: String,
  layout: String,
  overall: String,
  rating: Number,
  review: String
  
});

module.exports = mongoose.model("Feedback", FeedbackSchema);