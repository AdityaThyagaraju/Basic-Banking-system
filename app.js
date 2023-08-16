const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const LocalStrategy = require("passport-local").Strategy;
const nodemailer = require("nodemailer");
require("dotenv").config();
const ejs = require("ejs");
var bcrypt = require("bcrypt");

const app = express();
const saltRounds = 10;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "asdjhkjasdfsdfhk",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

const transactionSchema = new mongoose.Schema({
  transactionId: Number,
  from: Number,
  to: Number,
  amount: Number,
});

const Transaction = new mongoose.model("Transaction", transactionSchema);

const userSchema = new mongoose.Schema({
  name: String,
  username: Number,
  tpass: String,
  balance: Number,
  aadhaar: Number,
  email: String,
  transactions: [transactionSchema],
});

const adminSchema = new mongoose.Schema({
  username: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
adminSchema.plugin(passportLocalMongoose);

const accountCounter = new mongoose.Schema({
  index: Number,
  count: Number,
});

const transactionCounter = new mongoose.Schema({
  index: Number,
  count: Number,
});

const User = new mongoose.model("User", userSchema);
const Admin = new mongoose.model("Admin", adminSchema);
const TransactionCounter = new mongoose.model(
  "TransactionCounter",
  transactionCounter
);

passport.use("user", User.createStrategy());

passport.use("admin", Admin.createStrategy());

passport.serializeUser(function (user, done) {
  const prototype = Object.getPrototypeOf(user);
  let model = "";
  if (prototype === User.prototype) {
    model = "User";
  } else {
    model = "Admin";
  }
  done(null, {
    userID: user.id,
    userModel: model
  });
});

passport.deserializeUser(async function (obj, done) {
  if (obj.userModel === "User") {
    const user = await User.findOne({ _id: obj.userID });

    done(null, user);
  } else {
    const admin = await Admin.findOne({ _id: obj.userID });
    done(null, admin);
  }
});

const tpmailer = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_USN,
    pass: process.env.NODEMAILER_PASS,
  },
});

const aCount = new mongoose.model("AccountCount", accountCounter);

app.route("/").get(function (req, res) {
  res.render("index", { signin: true, logout: false });
});

app.route("/Announcements")
.get(function(req,res){
  res.render("announcements", { signin: true, logout: false });  
})

app
  .route("/Signin")
  .get(function (req, res) {
    if(req.isAuthenticated()){
      res.redirect("/Customer");
    }
    else{
      res.render("signin", { signin: false, logout: false });
    }
  })
  .post(function (req, res) {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
    });

    req.login(user, function (err) {
      if (err) {
        console.log("error");
      } else {
        passport.authenticate("user")(req, res, function (err) {
          if(err){
            console.log(err);
          }
          else{
            res.redirect("/Customer");
          }
        });
      }
    });
  });

app.get("/Customer", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("customer", { user: req.user, signin: false, logout: false });
  }
});

app.post("/Tpin", function (req, res) {
  if (req.body.pin === req.body.cpin) {
    if (req.isAuthenticated()) {
      bcrypt.hash(req.body.cpin, saltRounds, function (err, hash) {
        if (!err) {
            console.log(hash);
          User.updateOne({ username: req.user.username }, {$set:{ tpass: hash } }).then((info) => {
            if(info){
                res.redirect("/Customer");
                console.log(info);
            }
          });
        }
      });
    }
  }
});

app
  .route("/Withdraw")
  .get()
  .post(function (req, res) {
    if (req.isAuthenticated()) {
      bcrypt.compare(
        req.body.transactionPassword,
        req.user.tpass,
        function (err, result) {
          if (result) {
            User.updateOne(
              { username: req.user.username },
              { $inc: { balance: -req.body.amount } }).then(
                async function (info) {
                if (info) {
                  TransactionCounter.updateOne(
                    { index: 1 },
                    { $inc: { count: 1 } }).then(
                    async function (info) {
                      if (info) {
                        const tr = await TransactionCounter.findOne({
                          index: 1,
                        });
                        const trans = new Transaction({
                          transactionId: tr.count,
                          from: req.user.username,
                          to: 1,
                          amount:req.body.amount
                        });
                        trans.save();
                        User.updateOne(
                          { username: req.user.username },
                          { $addToSet: { transactions: trans } }).then(
                          function () {
                            res.redirect("/Customer");
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    }
  });

app
  .route("/Deposit")
  .get()
  .post(function (req, res) {
    if (req.isAuthenticated()) {
      bcrypt.compare(
        req.body.transactionPassword,
        req.user.tpass,
        function (err, result) {
          if (result) {
            User.updateOne(
              { username: req.user.username },
              { $inc: { balance: req.body.amount } }).then(
                async function (info) {
                if (info) {
                  TransactionCounter.updateOne(
                    { index: 1 },
                    { $inc: { count: 1 } }).then(
                    async function (info) {
                      if (info) {
                        const tr = await TransactionCounter.findOne({
                          index: 1,
                        });
                        const trans = new Transaction({
                          transactionId: tr.count,
                          from: 0,
                          to: req.user.username,
                          amount:req.body.amount
                        });
                        trans.save();
                        User.updateOne(
                          { username: req.user.username },
                          { $addToSet: { transactions: trans } }).then(
                          function () {
                            res.redirect("/Customer");
                          }
                        );
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    }
  });

app
  .route("/Transfer")
  .get()
  .post(function (req, res) {
    if (req.isAuthenticated()) {
      bcrypt.compare(
        req.body.transactionPassword,
        req.user.tpass,
        async function (err, result) {
         if(!err){
          const reciepient = await User.findOne({username:req.body.rId});
         if(reciepient){
          if (result) {
            User.updateOne(
              { _id: req.user.id },
              { $inc: { balance: -req.body.amount } }).then(
              function (info) {
                if (info) {
                  User.updateOne({username:req.body.rId},{$inc:{balance:req.body.amount}}).then(
                    function(){
                      TransactionCounter.updateOne(
                        { index: 1 },
                        { $inc: { count: 1 } }).then(
                        async function (info) {
                          if (info) {
                            const tr = await TransactionCounter.findOne({
                              index: 1,
                            });
                            const trans = new Transaction({
                              transactionId: tr.count,
                              from: Number(req.user.username),
                              to: Number(req.body.rId),
                              amount:req.body.amount
                            });
                            trans.save();
                            User.updateOne(
                              { _id: req.user.id },
                              { $addToSet: { transactions: trans } }).then(
                              function () {
                                res.redirect("/Customer");
                              }
                            );
                          }
                        }
                      )
                    }
                  );
                }
              }
            );
          }
         }
         else{
          res.send("no reciever with given recipientId");
         }
         }
        }
      );
    }
  });

app
  .route("/Admin-login")
  .get(function (req, res) {
    res.render("adminLogin", { signin: false, logout: false });
  })
  .post(function (req, res) {
    let admin = new Admin({
      adminname: req.body.username,
      password: req.body.password,
    });

    req.login(admin, function (err) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("admin")(req, res, function () {
          res.redirect("/Admin");
        });
      }
    });
  });

app
  .route("/Admin")
  .get(function (req, res) {
    if (req.isAuthenticated()) {
      res.render("admin", { signin: false, logout: true });
    }
  })
  .post(function (req, res) {
    const alpha =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$";
    let generatedPass = "";
    for (let i = 0; i <= 8; i++) {
      generatedPass += alpha[Math.floor(alpha.length * Math.random())];
    }
    aCount
      .updateOne({ index: 1 }, { $inc: { count: 1 } })
      .then(async function (docs) {
        if (!docs) {
          console.log(err);
        } else {
          let acount = await aCount.findOne({ index: 1 });
          const user = {
            username: acount.count,
            name: req.body.name,
            tpass: "#",
            balance: req.body.initialDeposit,
            aadhaar: req.body.aadhaarNum,
            email: req.body.email,
          };

          User.register(user, generatedPass, function (err) {
            if(err){
                console.log(err,user);
            }
            else{
                const options = {
                    from: "strollerrelorts@gmail.com",
                    to: req.body.email,
                    subject: "Online banking service",
                    text:
                      "Your Account number is" +
                      acount.count +
                      "Your banking password is :" +
                      generatedPass,
                  };
        
                  tpmailer.sendMail(options, function (err, info) {
                    if (!err) {
                      console.log(info);
                    } else {
                      console.log(err);
                    }
                  });
                res.redirect("/Admin");
            }
          });
        }
      });
  });



app.get("/Logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.listen(3000, function () {
  console.log("started at port 3000");
});
