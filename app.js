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
    Feedback             = require("./models/feedback"),
    Hash             = require("./models/userhash"),
    request             = require("request"),
    encrypt = require('mongoose-encryption'),
    sorted = require('sorted-array-functions'),
    sortedArr = require('sorted'),
     _ = require('underscore'),
    flash = require('connect-flash'),
    nodemailer = require("nodemailer"),
    async      = require("async"),
    crypto = require("crypto"),
    xoauth2 = require('xoauth2'),
    methodOverride = require('method-override'),
    helmet = require('helmet'),
    anychart = require('anychart'),
    nev = require('email-verification')(mongoose),
    randomHash = require('random-hash'),
    recaptcha = require('node-no-captcha');
    
    

    
   
let mongooseFieldEncryption = require('mongoose-field-encryption').fieldEncryption;


// setting up DB for mongoose
mongoose.connect("mongodb://localhost/blood_app",{
    useMongoClient: true,
});

var accountSid = 'ACc20534d22e383d916f841f2494ef4728'; // Your Account SID from www.twilio.com/console
var authToken = 'ab14229d3719a9f21a46d70acdd05583';   // Your Auth Token from www.twilio.com/console

var twilio = require('twilio');
var client = new twilio(accountSid, authToken);

// setting the default view engine to ejs
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));

app.use(flash());
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: 'sameorigin' }));
// Sets "X-Content-Type-Options: nosniff".
app.use(helmet.noSniff());

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
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Use bluebird
mongoose.Promise = require('bluebird');

// encoding the session and reading the users
// unencoding it and putting it session././
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
    req.flash('success', "You have logged out. In order to access your profile, please log in.");
    res.redirect("./");
})

// getting entered data from registration form
// Creating a new user with data and
// redirecting to user profile
app.post("/register", function(req, res){
    
   var hash = randomHash.generateHash({ length: 16 });    
   User.register(new User({username: req.body.username,email: req.body.email, 
                firstName: req.body.firstName, lastName: req.body.lastName,
                phoneNumber: req.body.phoneNumber, bloodType: req.body.bloodType,
                location: req.body.location, dob: req.body.dob, country: req.body.country,
                city: req.body.city, address: req.body.address, postcode: req.body.postcode, gender: req.body.gender, donatedAmount: 0, receivedAmount: 0}),
                req.body.password, function(err, user){
       
      if(err){
          
          req.flash('error', "You have logged out.");
          res.redirect("register");
      }
      
      Hash.create({hash: hash, user:{id : user._id}}, function(err, hash){
             if(err){
                 console.log(err);
             }else{
                 console.log(hash);
             }
         });
      
    //   client.messages.create({
    //   body: 'Your account is registered',
    //   to: '+447751572909',  // Text this number
    //   from: '+447481362889 ' // From a valid Twilio number
    //   });
    //  .then((message) => console.log(message.sid));

      passport.authenticate("local")(req, res, function(){
         res.redirect("/profile/" + user.username);
          
      });
       
   });
    
});


// Search route
app.get("/search", function(req, res) {
   
   res.render("search");
    
});

app.get("/verify/:id", function(req, res) {
    console.log(req.params.id);
    User.findOne({_id: req.params.id}, function(err, user){
        if(err){
            console.log(err);
        }else{
            
              Hash.findOne({user : {id: user._id}}, function(err, result) {
              if(err){
                  console.log(err);
              }else{
                  req.flash('success', "A verification link has been sent to your email");
                  res.redirect("/verify/" + result.hash + "/" + user.email);
                  
              }  
            })
        }
    })

})

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
      
      User.find({bloodType: regex1, country: regex2, city: regex3, postcode: regex4, active: true}, function(err, allUsers){
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
                    req.flash("success", "You have successfully added an entry to your history. You can look up your history of donations via 'Quick Access' links.");
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

// app.post("/addFriend/:id", function(req, res) {

//     User.findOne({username: req.body.friendUsername}, function(err, user){
        
//         if(err){console.log(err);}
//         else{
            
           
//             User.requestFriend(req.params.id, user._id, function(err, result){
//                 if(err){console.log(err);}
//                 else{
//                     console.log("Friend Request is succesful");
//                     res.redirect("/");
//                 }
//             })
//         }
//     })
// })

app.post("/cancelRequest/:username", function(req, res) {
      User.findOne({username: req.params.username}, function(err, user) {
        if(err){
            console.log(err);
        }else{
            
            User.requestFriend(req.user._id, user._id, function(err, result, next){
                if(err){console.log(err);}
                
                User.removeFriend(req.user, user, function(err, result){
                if(err){
                    console.log(err);
                }else{
                    console.log("Remove is succesful");
                    res.redirect("/profile/" + req.user.username);
                }
            })
            })
            


        }
    })
})

app.post("/removeFriend/:username", function(req, res) {

    User.findOne({username: req.params.username}, function(err, user) {
        if(err){
            console.log(err);
        }else{
            console.log("Remove Started");
            User.removeFriend(req.user, user, function(err, result){
                if(err){
                    console.log(err);
                }else{
                    console.log("Remove is succesful");
                    res.redirect("/profile/" + req.user.username);
                }
            })
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
                    var requestSent = false;
                    var requestReceived = false;

                    User.getFriends(user, {}, {username: req.user.username}, function(err, result){
                        if(err){
                            console.log(err);
                        }else{
                        
                            if(result.length != 0){
                                for(var friend in result){
                                   
                                    if(result[friend].status == 'accepted' && result[friend].friend.username== req.user.username){
                                             isFriend = true;
                                        }
                                        
                                        if(result[friend].status == 'requested'){
                                            requestReceived = true;
                                        }
                                        
                                        if(result[friend].status == 'pending'){
                                            requestSent = true;
                                        }
                                    }
                                }
                                
                            res.render("user", {currentUser:user, friends: friends, isFriend: isFriend, requestReceived: requestReceived, requestSent: requestSent});
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

app.get("/feedback", isLoggedIn, function(req, res) {
    res.render("feedback");
})

app.post("/feedback/add", function(req, res) {
    Feedback.create(req.body.feedback, function(err, feedback){
        if(err){
            console.log(err);
        }else{
            feedback.user.id = req.user._id;
            feedback.user.username = req.user.username;
            feedback.save();
            req.flash("success", "We appreciate your feedback and use it to improve our services.");
            res.redirect("/profile/" + req.user.username);
        }
    })
})

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


app.post("/addFriend/:id", function(req, res) {
    
    User.requestFriend(req.user.id, req.params.id, function(err, result){
                if(err){console.log(err);}
                else{
                    req.flash("success", "You have successfully made a friend request.");
                    res.redirect("/profile/"+ req.user.username);
                }
            })
    
})

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

      req.flash("success", "Thanks for your message. Our team will get back to you soon.");    
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

      req.flash("success", "Thanks for letting us know. We will investigate the user and take necessary actions.");
      res.redirect('/profile/' + req.user.username);
  }); 
});

// -----------------------------VERIFY-----------------------------------------
app.get('/verify/:hash/:email', function (req, res) {
   
    const output = ` https://webdevelopment-captainwebs.c9users.io/emailverification/${req.params.hash}`;
  
   let recipient = req.params.email;

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
      to: recipient, // list of receivers
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

      req.flash("success", "Verification link has been sent your email. Please check your mail and activate your account."); 
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
            req.flash("success", "You have successfully updated your profile information.");
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

app.get("/emailverification/:hash", function(req, res){
    Hash.findOne({hash: req.params.hash}, function(err, hash){
        if(err){
            console.log(err);
        }else{
            console.log("----------------------------------------------")
            User.findOneAndUpdate({_id: hash.user.id}, {$set:{active:true}}, function(err, user){
                if(err){
                    console.log(err);
                }else{
                    user.save();
                    console.log("User activated");
                    Hash.remove({hash: req.params.hash}, function(err, result){
                        if(err){
                            console.log(err);
                        }else{
                            req.flash('success', "Success! You have successfully activated your profile.");
                            res.redirect("/profile/" + user.username);
                        }
                    })
                    
                }
            })
        }
    })
})

// ******************************PASSWORD RESET*******************************
// forgot password
app.get('/forgot', function(req, res) {
  res.render('forgot');
});

app.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if(err){}  
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'nurlanisazadah@gmail.com',
          pass: 'NurlanVusale18'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'nurlanisazadah@gmail.com',
        subject: 'BloodDonor Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

app.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if(err){}  
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

app.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if(err){}  
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirmpassword) {
          user.setPassword(req.body.password, function(err) {
            if(err){}  
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'nurlanisazadah@gmail.com',
          pass: 'NurlanVusale18'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'nurlanisazadah@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n\n' +
          'Sincerely, \n\n' +
          'BloodDonor Team.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        done(err);
      });
    }
  ], function(err) {
    if(err){}  
    req.flash('success', 'Success! Your password has been changed.');
    res.redirect('/profile/' + req.user.username);
  });
});

// ****************************************************************************

app.get("/urgent/:username", function(req, res) {
     const output = `
    <h3>Urgent Need from BlooDonor Application</h3>
    <h4>Sender: @${req.user.username}</h4>
    <h4>I want to contact @${req.params.username} urgently because I need blood donation within the next 48 hours.</h4>
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
      to: 'nurlanisazadah@gmail.com, <recipient>', // list of receivers
      subject: 'Urgent Need', // Subject line
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

      req.flash("success", "We have received your request and our team member will contact you shortly to confirm the action then necessary step will be taken.");
      res.redirect('/profile/' + req.user.username);
  }); 
})

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