const express = require("express")
const app = express()
const dotenv = require('dotenv');
const cors = require('cors')
const cookieParser = require('cookie-parser');
dotenv.config();
const UR = require("./Routes/User")
const CR = require("./Routes/Company");
// Ignore Admin

const AR = require("./Routes/Admin");

require('./conn')
app.use(express.json())
app.use(cors())
app.use(cookieParser());
app.use('/user',UR)
app.use('/company',CR)
// Ignore Admin
app.use('/admin',AR)

app.get("/",(req,res)=>{
    res.send("server is up and running...")
})


app.listen(process.env.PORT || 5000,(e)=>{
    console.log("Server is up and runnig");
})