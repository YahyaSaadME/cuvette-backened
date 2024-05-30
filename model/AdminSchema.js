const mongoose = require("mongoose")

const AdminSchema = new mongoose.Schema({
    name: { type: String },
    password: { type: String },
    regno: { type: String },
    email: { type: String, unique: true },
    carousel: [
        {
            cid: { type: String },
            name: { type: String },
            img: { type: String },
            content: { type: String },
            approved: { type: Boolean },
            link: { type: String },
            position: { type: Number }
        }
    ],
    news: [{
        cid: { type: String },
        name: { type: String },
        head: { type: String },
        content: { type: String },
        description: { type: String },
        date: { type: Date },
        approved: { type: Boolean },
        link: { type: String },
        position: { type: Number }
    }],
    trending: [{
        head: { type: String },
        content: { type: String },
        approved: { type: Boolean },
    }],
    events: [
        {
            cid: { type: String },
            title: { type: String },
            description: { type: String },
            content: { type: String },
            timeStart: { type: String },
            timeEnd: { type: String },
            approved: { type: Boolean },
            link: { type: String },
            name: { type: String },
        }
    ]

})

const AM = mongoose.model('admin', AdminSchema)
module.exports = AM 