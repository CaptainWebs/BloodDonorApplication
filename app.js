var express             = require("express"),
    app                 =  express(),
    router              = express.Router({mergeParams: true}),
    passport            = require("passport"),
    passportLocal       = require("passport-local"),
    passportMongoose    = require("passport-local-mongoose"),
    mongoose            = require("mongoose"),
    bodyParser          = require("body-parser"),
    User                = require("./models/user"),
    request             = require("request");
    
    

// setting up DB for mongoose
mongoose.connect("mongodb://localhost/blood_app",{
    useMongoClient: true,
});



// setting the default view engine to ejs
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

passport.use(new passportLocal(User.authenticate()));

app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});


// encoding the session and reading the users
// unencoding it and putting it session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
    
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

app.post("/login", passport.authenticate("local",{
    
    successRedirect: "./",
    failureRedirect: "/login"
    
}),function(req, res){
    
    
    
});

// ---------------    
// Register route
// ---------------

// show signup form
app.get("/register", function(req, res){
   
   res.render("register"); 
    
});


// Logout route
app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("./");
})

// getting the user registration and posting it
app.post("/register", function(req, res){
    
   User.register(new User({username: req.body.username,email: req.body.email, 
                firstName: req.body.firstName, lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber, bloodType: req.body.bloodType,
                location: req.body.location, dob: req.body.dob, country: req.body.country,
                city: req.body.city, address: req.body.address, postcode: req.body.postcode}),
                req.body.password, function(err, user){
       
      if(err){
          console.log("Problem occured during the registration of the user. Error: " + err);
          return res.render("register");
      }
      
      passport.authenticate("local")(req, res, function(){
         
         res.render("profile", {currentUser:user});
          
      });
       
   });
    
});

// app.post("/profile", function(req, res) {
   
//   res.render("profile",{req.user})
    
// });

app.get("/profile/:userID", function(req, res){
    res.render("profile");
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next;
    }
    
    res.redirect("/login");
}

// setup of necessary ports for the server
app.listen(process.env.PORT, process.env.IP, function(){
    
    console.log("The Blood Donor server is started and running.");
    
})    