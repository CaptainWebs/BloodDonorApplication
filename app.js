var express             = require("express"),
    app                 =  express(),
    router              = express.Router({mergeParams: true}),
    passport            = require("passport"),
    passportLocal       = require("passport-local"),
    passportMongoose    = require("passport-local-mongoose"),
    mongoose            = require("mongoose"),
    bodyParser          = require("body-parser"),
    User                = require("./models/user"),
    History             = require("./models/history"),
    request             = require("request"),
    encrypt = require('mongoose-encryption'),
    sorted = require('sorted-array-functions'),
    sortedArr = require('sorted'),
     _ = require('underscore'),
    flash = require('connect-flash'),
    nodemailer = require("nodemailer"),
    xoauth2 = require('xoauth2'),
    methodOverride = require('method-override'),
    helmet = require('helmet');
    
    
   
let mongooseFieldEncryption = require('mongoose-field-encryption').fieldEncryption;


// setting up DB for mongoose
mongoose.connect("mongodb://localhost/blood_app",{
    useMongoClient: true,
});



// setting the default view engine to ejs
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));

app.use(flash());


app.use(require("express-session")({
    secret: "I Love Vusala",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(User.authenticate()));

app.use(function(req, res, next){
    res.locals.logUser = req.user;
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
    console.log(req.user);
    res.render("index");
    
});

// ---------------    
// Login route
// ---------------

app.get("/login", function(req, res){
   
   res.render("login"); 
    
});


// Refresh login page on unsuccesful login
app.post("/login", passport.authenticate("local",{
    
    failureRedirect: "/login"
    
}),function(req, res){
    
    // Redirec to user profile on succesful login
    res.redirect("/profile/" + req.body.username);
    
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

// getting entered data from registration form
// Creating a new user with data and
// redirecting to user profile
app.post("/register", function(req, res){
    
   User.register(new User({username: req.body.username,email: req.body.email, 
                firstName: req.body.firstName, lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber, bloodType: req.body.bloodType,
                location: req.body.location, dob: req.body.dob, country: req.body.country,
                city: req.body.city, address: req.body.address, postcode: req.body.postcode, gender: req.body.gender, openFor: req.body.donationType, donatedAmount: 0, receivedAmount: 0}),
                req.body.password, function(err, user){
       
      if(err){
          console.log("Problem occured during the registration of the user. Error: " + err);
          return res.render("register");
      }
      
      passport.authenticate("local")(req, res, function(){
         
         res.redirect("/profile/" + user.username);
          
      });
       
   });
    
});


// Search route
app.get("/search", function(req, res) {
   
   res.render("search");
    
});


// search the database according to the data
// retrieved from search field
// collect the data in collection called 'allUsers'
// pass the collection and render 'donor'

app.get("/results", function(req, res) {
  
  let fieldEncryption = require('mongoose-field-encryption')
  let encrypted = fieldEncryption.encrypt('some text', 'vusala');
  let decrypted = fieldEncryption.decrypt(encrypted, 'vusala');
  
  if(req.query.bloodType){
      
      const regex1 = new RegExp(escapeRegex(req.query.bloodType), 'gi');
      const regex2 = new RegExp(escapeRegex(req.query.country), 'gi');
      const regex3 = new RegExp(escapeRegex(req.query.city), 'gi');
      const regex4 = new RegExp(escapeRegex(req.query.postcode), 'gi');
      
      User.find({bloodType: regex1, country: regex2, city: regex3, postcode: regex4}, function(err, allUsers){
          if(err){
              console.log(err);
          }else{
              res.render("donors",{users: allUsers});
          }
      });
  }
   
  
});

// Reporting user that is associated with this username
app.get("/report/:username", isLoggedIn, function(req, res){
    console.log(req.params.username);
    if(req.params.username){
        
        User.find({username: req.params.username}, function(err, foundUser){
  
            if(err){
                console.log(err);
            }else{
                res.render("report", {reportUser: foundUser});
            }
        });
    }
    
});

// adding history data to a user
app.post("/profile/:username/history/add", function(req, res) {
    User.findOne({username: req.params.username}, function(err, user){
        if(err){console.log(err);}
        else{
            
            History.create(req.body.entry, function(err, history){
                if(err){console.log(err);}
                else{

                    history.donor.id = user._id;
                    history.donor.username = user.username;
                    history.save();
                    // console.log(history.date)
                    sorted.add(user.histories, history);
                    // user.histories.push(history);
    
                
                    // if history is type 'donated to'
                    // add the amount to 'donatedAmount', else
                    // add the amount to 'receivedAmount'
                    if(history.type == "donated blood to"){
                        user.donatedAmount += history.amount;
                    }else if(history.type == "received blood from"){
                        user.receivedAmount += history.amount;
                    }
                    console.log(history.date.getTime());
                    
                    console.log(user.lastDonationDate);
                    
                    if (typeof myVar == 'undefined' || user.lastDonationDate < history.date.getTime()){
                        user.lastDonationDate = history.date.getTime();
                    }
                    
                    user.save();
                    res.redirect("/profile/" + req.params.username);
                }
            });
            

        }
    });
});

app.get("/usersearch/:username", function(req, res) {
   
   User.findOne({username: req.params.username}, function(err, user) {
       if(err){
           console.log(err);
       }else{
        // finding the blood type of the user
           var bloodType = user.bloodType.slice(0,2);
           
        // determining the users that can donate their blood to this user
        
        if(bloodType == "A+"){
            User.find({$or:[{bloodType: 'A+ (A Rhd positive)'},{bloodType: 'A- (A Rhd negative)'},{bloodType: 'O+ (O Rhd positive)'},{bloodType: 'O- (O Rhd negative)'}]}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            });
        }else if(bloodType == "O+"){
            User.find({$or:[{bloodType: 'O+ (O Rhd positive)'},{bloodType: 'O- (O Rhd negative)'}]}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            });
            
        }else if(bloodType == "B+"){
            
            User.find({$or:[{bloodType: 'O+ (O Rhd positive)'},{bloodType: 'O- (O Rhd negative)'}, {bloodType: 'B+ (B Rhd positive)'},{bloodType: 'B- (B Rhd negative)'}]}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            }); 
            
        }else if(bloodType == "AB+ (AB Rhd positive)"){
            
            User.find({}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            }); 
            
        }else if(bloodType == "A- (A Rhd negative)"){
            User.find({$or:[{bloodType: 'A- (A Rhd negative)'},{bloodType: 'O- (O Rhd negative)'}]}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            });
            
        }else if(bloodType == "O- (O Rhd negative)"){
            User.find({$or:[{bloodType: 'O- (O Rhd negative)'}]}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            });
        }else if(bloodType == "B- (B Rhd negative)"){
            User.find({$or:[{bloodType: 'B- (B Rhd negative)'},{bloodType: 'O- (O Rhd negative)'}]}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            });  
        }else if(bloodType == "AB- (AB Rhd negative)"){
             User.find({$or:[{bloodType: 'AB- (AB Rhd negative)'},{bloodType: 'O- (O Rhd negative)'},{bloodType: 'B- (B Rhd negative)'}]}, function(err, users) {
                if(err){
                    console.log(err);
                }else{
                    res.render("donors", {users: users});
                }
            });
        }
          
       }
   });
  
    
});

app.post("/addFriend/:id", function(req, res) {

    User.findOne({username: req.body.friendUsername}, function(err, user){
        
        if(err){console.log(err);}
        else{
            
           
            User.requestFriend(req.params.id, user._id, function(err, result){
                if(err){console.log(err);}
                else{
                    console.log("Friend Request is succesful");
                    res.redirect("/");
                }
            })
        }
    })
})

app.post("/removeFriend/:username", function(req, res) {

    User.findOne({username: req.params.username}, function(err, user){
        
        if(err){console.log(err);}
        else{
            
            console.log("----------------------------");
            var Status = require("mongoose-friends").Status;
            User.getFriends(user, {"myCustomPath.status": Status.Pending}, function(err, requestList) {
                if(err){console.log(err);}
                else{
                    
                    var index=5;

                    requestList.forEach(function(request){
                        if(request._id == req.body.friendID){
                            index = requestList.indexOf(request);
                        }
                    })
                    
                    // requestList.splice(index, 1);
                    delete requestList[index];
                    res.redirect("/");
                    
                }
            });
        }
    })
})

app.get("/requests/:username", function(req, res) {
    var Status = require("mongoose-friends").Status;
    User.findOne({username: req.params.username}, function(err, user) {
        if(err){console.log(err);}
        else{
            var sent;
            var received;
             User.getFriends(user, {"myCustomPath.status": Status.Pending}, function(err, friendList){
                 if(err){console.log(err);}
                 else{

                    //  res.render("friendrequests", {friends: friendList});
                    User.getFriends(user, {"myCustomPath.status": Status.Requested}, function(err, friendList2){
                        if(err){console.log(err);}
                        else{

                           if(typeof friendList == "undefined" || friendList == null){friendList = [];}
                           if(typeof friendList2 == "undefined" || friendList2 == null){friendList2 = [];}
                           res.render("friendrequests", {friends: friendList,friends2:friendList2, currentUser:user});
                           
                        }
                    })
                 }
             });
        }
    })
})

app.get("/profile/:username", isLoggedIn, function(req, res){
    
    User.findOne({username:req.params.username}, function(err, user) {
        if(err){
            console.log(err);
        }else{
            
            if(user.username != req.user.username){
                
               var Status = require("mongoose-friends").Status;
                User.getFriends(user, {"myCustomPath.status": Status.Accepted}, function(err, friends){
                if(err){
                    console.log(err);
                }else{
                    var isFriend = false;

                    User.getFriends(user, {}, {username: req.user.username}, function(err, result){
                        if(err){
                            console.log(err);
                        }else{
                            if(result.length != 0){
                                isFriend = true;
                            }
                            console.log(isFriend);
                            res.render("user", {currentUser:user, friends: friends, isFriend: isFriend});
                        }
                    });
                    
                     
                }
            });
            
            }else{
                var Status = require("mongoose-friends").Status;
                User.getFriends(user, {"myCustomPath.status": Status.Accepted}, function(err, friends){
                if(err){
                    console.log(err);
                }else{
                     res.render("profile", {currentUser:user, friends: friends});
                }
            });
                
            }
    
           
        }
    });
    
});



app.get("/profile/:username/history",function(req, res) {

    
    User.findOne({username:req.params.username}, function(err, user){
        
        if(err){console.log(err);}
        else{

              History.find({donor : {id: user._id, username: user.username}}, function(err, history){
                  if(err){console.log(err);}
                  else{
                      res.render("history", {history : history});
                  }
              });          


        }
        
        
    });
});

// -----------------------------EMAIL(start)------------------------------------
// sending questions of user
// to email with the question body and user email

//                               QUESTION
app.post('/send/:type', function (req, res) {
   
    const output = `
    <h3>${req.params.type} from BlooDonor Application</h3>
    <h4>Username: ${req.user.username}</h4>
    <p>${req.body.message}</p>
  `;
  
  let recipient = req.user.email;
  let type = req.params.type;


  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'nurlanisazadah', // generated ethereal user
        pass: 'NurlanVusale18'  // generated ethereal password
    },
    tls:{
      rejectUnauthorized:false
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"BlooDonor Application" <recipient>', // sender address
      to: 'nurlanisazadah@gmail.com', // list of receivers
      subject: type, // Subject line
      text: 'BlooDonor Application', // plain text body
      html: output // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);   
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        console.log(req.user);
      res.redirect('/profile/' + req.user.username);
  }); 
});

//                REPORT

app.post('/report/:username', function (req, res) {
   
    const output = `
    <h3>Report from BlooDonor Application</h3>
    <h4>Sender: @${req.user.username}</h4>
    <h4>I want to report: @${req.params.username}</h4>
    <p>${req.body.message}</p>
  `;
  
  let recipient = req.user.email;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'nurlanisazadah', // generated ethereal user
        pass: 'NurlanVusale18'  // generated ethereal password
    },
    tls:{
      rejectUnauthorized:false
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
      from: '"BlooDonor Application" <recipient>', // sender address
      to: 'nurlanisazadah@gmail.com', // list of receivers
      subject: 'Report', // Subject line
      text: 'BlooDonor Application', // plain text body
      html: output // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return console.log(error);
      }
      console.log('Message sent: %s', info.messageId);   
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        console.log(req.user);
      res.redirect('/profile/' + req.user.username);
  }); 
});

// -----------------------------EMAIL(end)--------------------------------------

// Sending postcode data to find the nearby hospitals
app.get("/nearby", function(req, res) {
    res.render("nearby",{nearbyhospital: req.body.nearbyhospital});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}



// ------------------- FIND and UPDATE ----------------------------------------
app.get("/profile/:username/edit", function(req, res){
    
    User.findOne({username: req.params.username}, function(err, user){
        if(err){
            console.log(err);
        }else{
            res.render("edit", {edituser: user});
        }
    })
    
});

// Finding the user associated with the given id
// Updating the fields that are changed
app.put("/update/:id/edit", function(req, res){
    User.findByIdAndUpdate(req.params.id, req.body.update, function(err, result){
        if(err){
            console.log(err);
        }else{
            res.redirect("/profile/"+result.username);
        }
    })
})

// ----------------------------------------------------------------------------

// Binary find function to insert elements in-order to the
// histories array of each user
function binaryFind(array, searchElement){
    'use strict';
    var minIndex = 0;
    var maxIndex = array.length - 1;
    var currentIndex;
    var currentElement;
    
    while (minIndex <= maxIndex) {
    currentIndex = (minIndex + maxIndex) / 2 | 0;
    currentElement = array[currentIndex];

    if (currentElement < searchElement) {
      minIndex = currentIndex + 1;
    }
    else if (currentElement > searchElement) {
      maxIndex = currentIndex - 1;
    }
    else {
      return { // Modification
        found: true,
        index: currentIndex
      };
    }
  }      

  return { // Modification
    found: false,
    index: currentElement < searchElement ? currentIndex + 1 : currentIndex
  };
}

// middleware function to check if
// the user is logged in or,
// ask to login if they want to access
// user specific pages

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}



// setup of necessary ports for the server
app.listen(process.env.PORT, process.env.IP, function(){
    
    console.log("The Blood Donor server is started and running.");
    
})    