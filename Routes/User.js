const express = require("express");
const UR = express.Router();
const UM = require("../model/UserSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const AM = require("../model/AdminSchema");
const CM = require("../model/CompanySchema");

UR.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (name == "" || password == "" || email == "" || name == null || password == null || email == null) {
      res.json({ msg: "Please fill all the fields" });
    } else {
      const findbyEmail = await UM.find({ email });
      if (findbyEmail.length > 0) {
        res.json({ msg: "User already exists" });
      } else {
        bcrypt.genSalt(Number(process.env.SaltNo), async (err, salt) => {
          if (err) {
            return res.status(500).json({ msg: "Something went wrong!" });
          } else {
            const combinedSalt = `${salt}${process.env.Salt}`;
            const hashedPassword = await bcrypt.hash(password, combinedSalt);
            const user = await UM.create({
              name,
              password: hashedPassword,
              email,
            });
            if (user) {
              const token = jwt.sign(
                {
                  name: user.name,
                  id: user._id,
                  email: user.email,
                },
                process.env.token,
                { expiresIn: 10 * 24 * 60 * 60 }
              );
              res.cookie("user", token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax"
              });
              res.json({ msg: { token } });
            } else {
              res.json({ msg: "Something went wrong!" });
            }
          }
        });
      }
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!" });
  }
});

UR.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email == "") {
      res.json({ msg: "Please fill all the fields!" });
    } else {
      const findbyEmail = await UM.findOne({ email });

      if (findbyEmail == null) {
        res.json({ msg: "Email or Password is wrong!" });
      } else {
        bcrypt.compare(password, findbyEmail.password, function (err, result) {
          if (err) {
            res.json({ msg: "Something went wrong!" });
          } else if (result) {
            const token = jwt.sign(
              {
                name: findbyEmail.name,
                id: findbyEmail._id,
                email: findbyEmail.email,
              },
              process.env.token,
              { expiresIn: 10 * 24 * 60 * 60 }
            );
            res.cookie("PAUAT", token, { httpOnly: true });
            res.json({ msg: { token } });
          } else {
            res.json({ msg: "Email or Password is wrong!" });
          }
        });
      }
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!" });
  }
});

UR.post("/protected", (req, res) => {
  const token = req.body.token;
  if (!token) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  jwt.verify(token, process.env.token, async (err, decoded) => {
    try {

      if (err) {
        return res.status(403).json({ msg: "Token validation failed" });
      }
      const user = await UM.findOne({ _id: decoded.id });
      if (user) {
        res.json({
          msg: "Access granted",
          data: user
        });
      } else {
        return res.status(403).json({ msg: "User not found!" });
      }
    } catch (error) {
      return res.status(403).json({ msg: "Token validation failed" });
    }
  });
});

UR.get("/jobs", async (req, res) => {
  try {
    const data = await CM.aggregate([
      { $unwind: "$Jobs" },
      { $project: { _id: 0, name: 1, address: 2, job: "$Jobs" } }
    ])
    res.json(data)
  } catch (e) {
    console.log(e);
    res.json({ msg: "Something went wrong!" })
  }
})

UR.post("/job/apply", async (req, res) => {
  try {
    const { _id, jobs_post_id, proposal, company_name } = req.body
    const add_member = await CM.updateOne({ 'Jobs._id': new mongoose.Types.ObjectId(jobs_post_id) },
      {
        $push: { 'Jobs.$.applicants': { userId: _id, status: 1, date: new Date } }
      })

    const add_company = await UM.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(_id) }, {
      $push: {
        appliedCompanies: {
          appliedOn: new Date,
          status: 1,
          name: company_name,
          jobs_post_id: jobs_post_id,
          proposal: proposal
        }
      }
    })
    if (add_company && add_member) {
      res.json({ msg: "Applied successfully!", updated: true })
    } else {
      res.json({ msg: "Something went wrong!", updated: false })
    }

  } catch (error) {
    console.log(error);
    res.json({ msg: "Something went wrong!", updated: false })
  }
})

UR.get("/job", async (req, res) => {
  try {
    const { jpid } = req.query
    if (!jpid) {
      res.json({ msg: "Something went wrong!" })
    } else {
      const data = await CM.findOne({ Jobs: { $elemMatch: { _id: jpid } } })
      let found = false
      data.Jobs.map((e, i) => {
        if (e._id == jpid) {
          found = true
          res.json({ data: e, cdata: { name: data.name, address: data.address, linkedIn: data.linkedIn, website: data.website, about: data.about } })
        }
      })
      if (!found) {
        res.json({ msg: "Something went wrong!" })
      }
    }

  } catch (e) {
    res.json({ msg: "Something went wrong!" })
  }
})
UR.get("/job/search", async (req, res) => {
  try {
    const { search } = req.query
    console.log(search);
    const data = await CM.aggregate([
      { $unwind: "$Jobs" },
      { $match: { "Jobs.title": { $regex:search,$options:'i' } } },
      { $project: { _id: 0, name: 1, address: 2, job: "$Jobs" } }
    ])
    res.json(data)

  } catch (e) {
    res.json({ msg: e })
    // res.json({ msg: "Something went wrong!" })
  }
})

UR.get("/job/myproposals", async (req, res) => {
  try {
    const data = await UM.find({ Jobs: { $elemMatch: { _id: jpid } } })
    let found = false
    data.Jobs.map((e, i) => {
      if (e._id == jpid) {
        found = true
        res.json({ data: e, cdata: { name: data.name, address: data.address, linkedIn: data.linkedIn, website: data.website, about: data.about } })
      }
    })
    if (!found) {
      res.json({ msg: "Something went wrong!" })
    }

  } catch (e) {
    res.json({ msg: "Something went wrong!" })
  }
})

UR.post("/profile/resume", async (req, res) => {
  try {
    const { _id, doc } = req.body

    const add = await UM.updateOne({ _id: new mongoose.Types.ObjectId(_id) }, {
      $set: {
        resume: doc
      }
    })
    if (add) {
      res.json({ msg: "Resume added successfully!", updated: true })
    } else {
      res.json({ msg: "Something went wrong!", updated: false })
    }

  } catch (error) {
    console.log(error);
    res.json({ msg: "Something went wrong!", updated: false })
  }
})
UR.post("/profile/update", async (req, res) => {
  try {
    const { _id, experience, email, name, jobTitle, company, linkedin, github, website, status, JoinDate } = req.body
    const add = await UM.updateOne({ _id: new mongoose.Types.ObjectId(_id) }, {
      $set: {
        experience, email, name, title: jobTitle,
        WorkingCompany: {
          company,
          status,
          JoinDate
        },
        socials: {
          linkedin, github, website
        }
      }
    })
    console.log(add);
    if (add) {
      res.json({ msg: "Updated added successfully!", updated: true })
    } else {
      res.json({ msg: "Something went wrong!", updated: false })
    }

  } catch (error) {
    console.log(error);
    res.json({ msg: "Something went wrong!", updated: false })
  }
})


module.exports = UR;
