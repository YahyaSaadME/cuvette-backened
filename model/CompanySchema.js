const mongoose = require("mongoose");

const Companychema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  about: { type: String },
  address: { type: String },
  phone: { type: Number },
  linkedIn: { type: String },
  website:{type: String},
  StartedAt:{type:Date},
  Jobs: [{
    title: { type: String },
    requirements: { type: String },
    offerPriceStart: { type: Number },
    offerPriceEnd: { type: Number },
    duration: { type: Number },
    experinceStart: { type: Number },
    experinceEnd: { type: Number },
    workType: { type: Number },
    skills: [{ type: String }],
    date: { type: Date },
    ExtraBenifits: { type: String },
    tags:[{type:String}],
    status:{type: Number},
    jobType:{type:Number},
    applicants:[
      {
        userId:{type:String},
        status:{type:Number},
        date:{type:Date}
      }
    ]
  }],
  members: [{
    userId: { type: String },
    status: { type: Number },
  }],
  status: { type: Number },
});

const CM = mongoose.model("Company", Companychema);
module.exports = CM;
