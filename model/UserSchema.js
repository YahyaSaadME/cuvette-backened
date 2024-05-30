const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    name: { type: String },
    password: { type: String },
    email: { type: String, unique: true },
    socials: { github: { type: String }, linkedin: { type: String },website:{type:String} },
    experience:{type:Number},
    title:{type:String},
    WorkingCompany:{
        company:{type:String},
        status:{type:Number},
        JoinDate:{type:Date},
    },
    appliedCompanies:[{
        appliedOn:{type:String},
        status:{type:Number},
        name:{type:String},
        jobs_post_id:{type:String},
        proposal:{type:String}
    }],
    resume:{type:String}
})

const UM = mongoose.model('user', UserSchema)
module.exports = UM 