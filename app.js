var express             = require("express"),
    app                 =  express(),
    passport            = require("passport"),
    passportLocal       = require("passport-local"),
    passportMongoose    = require("passport-local-mongoose"),
    mongoose            = require("mongoose"),
    bodyParser          = require("body-parser"),
    request             = require("request");
    
    
// setting the default view engine to ejs
app.set("view engine", "ejs");
app.use(express.static("public"));
    
// ---------------------------------    
//             ROUTES
// ---------------------------------  

// ---------------    
// Index route
// ---------------

app.get("/", function(req, res){
    
    res.render("index");
    
});

// ---------------    
// Login route
// ---------------

app.get("/login", function(req, res){
   
   res.render("login"); 
    
});

// ---------------    
// Register route
// ---------------

app.get("/register", function(req, res){
   
   res.render("register"); 
    
});


// setup of necessary ports for the server
app.listen(process.env.PORT, process.env.IP, function(){
    
    console.log("The Blood Donor server is started and running.");
    
})    