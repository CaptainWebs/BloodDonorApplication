var mongoose = require("mongoose");
var passportMongoose = require("passport-local-mongoose");

var HashSchema = new mongoose.Schema({

  user:
  {
      id:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      }
      
  },
  
  hash: String
  
});

module.exports = mongoose.model("Hash", HashSchema);