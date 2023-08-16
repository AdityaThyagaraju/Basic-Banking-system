const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

mongoose.connect("mongodb+srv://adityauday2002:2uWkRuqwu53jlyWA@cluster0.wf23erq.mongodb.net/?retryWrites=true&w=majority", {useNewUrlParser: true});

const adminSchema = new mongoose.Schema({
    username:String
});

adminSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin",adminSchema);

Admin.register({username:"1Admin1"},"$ADM$",function(err,user){
    console.log(user);
});

const acountSchema = new mongoose.Schema({
    index:Number,
    count:Number
});

const Count = new mongoose.model("Accountcount",acountSchema);

let acount = new Count({
    index:1,
    count:1000
});

acount.save()

const transactionCountSchema = new mongoose.Schema({
    index:Number,
    count:Number
});

const tCount = new mongoose.model("TransactionCounter",transactionCountSchema);

let tcount = new tCount({
    index:1,
    count:1000
});

tcount.save();
