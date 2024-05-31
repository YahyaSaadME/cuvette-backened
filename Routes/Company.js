const express = require("express");
const CR = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const { Types } = require("mongoose");
const AM = require("../model/AdminSchema");
const CM = require("../model/CompanySchema");
const UM = require("../model/UserSchema");

// const slider = multer({
//   storage: multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "Resources/carousel/"); // Destination folder for uploaded files
//     },
//     filename: function (req, file, cb) {
//       cb(
//         null,
//         file.fieldname + "-" + Date.now() + path.extname(file.originalname)
//       );
//     },
//   }),
// });

// CR.use(
//   "/carousel",
//   express.static(path.join(__dirname, "../Resources/carousel/"))
// );


CR.post("/signup", async (req, res) => {
  try {
    const { password, name, email, address, linkedIn, website } = req.body;
    if (name == "" || password == "" || email == "" || name == null || password == null || email == null) {
      res.json({ msg: "Please fill all the fields" });
    } else {
      const findbyEmail = await CM.find({ email });
      if (findbyEmail.length > 0) {
        res.json({ msg: "Company already exists" });
      } else {
        bcrypt.genSalt(Number(process.env.SaltNo), async (err, salt) => {
          if (err) {
            return res.status(500).json({ msg: "Something went wrong!" });
          } else {
            const combinedSalt = `${salt}${process.env.Salt}`;
            const hashedPassword = await bcrypt.hash(password, combinedSalt);
            const company = await CM.create({
              password: hashedPassword,
              name,
              email,
              address,
              linkedIn,
              status: 1,
              website
            });
            if (company) {
              const token = jwt.sign(
                {
                  id: company._id,
                  name: company.name,
                  email: company.email,
                  about: company.about,
                  logo: company.logo,
                  address: company.address,
                  phone: company.phone,
                  linkedIn: company.linkedIn,
                  status: company.status

                },
                process.env.token,
                { expiresIn: 10 * 24 * 60 * 60 }
              );
              res.cookie("company", token, {
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
CR.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email == "" || password == "") {
      res.json({ msg: "Please fill all the fields!" });
    } else {
      const findbyCid = await CM.findOne({ email: email });
      if (!findbyCid) {
        res.json({ msg: "Email or Password is wrong!" });
      } else {
        bcrypt.compare(password, findbyCid.password, function (err, company) {
          if (err) {
            res.json({ msg: "Something went wrong!" });
          } else if (company) {
            const token = jwt.sign(
              {
                email: findbyCid.email,
              },
              process.env.token,
              { expiresIn: 10 * 24 * 60 * 60 }
            );
            res.cookie("company", token, { httpOnly: true });
            res.status(200).json({ msg: "Access granted", token });
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
CR.post("/protected", async (req, res) => {
  try {

    const token = req.body.token;
    if (!token) {
      return res.status(401).json({ msg: "Unauthorized" });
    }
    jwt.verify(token, process.env.token, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ msg: "Token validation failed" });
      }
      const findbyCid = await CM.findOne({ email: decoded.email });

      if (findbyCid) {
        res.json({
          msg: "Access granted",
          id: findbyCid._id,
          name: findbyCid.name,
          email: findbyCid.email,
          about: findbyCid.about,
          logo: findbyCid.logo,
          address: findbyCid.address,
          phone: findbyCid.phone,
          linkedIn: findbyCid.linkedIn,
          status: findbyCid.status,
          Jobs: findbyCid.Jobs,
          website: findbyCid.website,
        });
      } else {
        res.json({
          msg: "Account deleted"
        })
      }
    });

  } catch (error) {

  }
});

//Job Post
// Work type: 0 - Onsite | 1 - Remote | 2- Hybrid 
// Status: 0 - outdated | 1 - applied | 2 - selected for interview
// JubType: 0-Full time | 1 - intenernship
CR.post("/job/add", async (req, res) => {
  try {
    const { title, requirements, tags, offerPriceEnd, offerPriceStart, duration, experinceStart, experinceEnd, workType, skills, ExtraBenifits, _id, jobType } = req.body;
    const addJob = await CM.findByIdAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $push: {
        Jobs: {
          title, requirements, tags, offerPriceEnd, offerPriceStart, duration, experinceStart, experinceEnd, workType, skills, ExtraBenifits, date: new Date, status: 1, jobType
        }
      }
    })
    if (addJob) {
      res.json({ msg: "New post added successfully!", created: true })
    } else {
      res.json({ msg: "Something went wrong!", created: false })
    }
  } catch (error) {
    console.log(error);
    res.json({ msg: "Something went wrong!", created: false })
  }
});
CR.delete("/job/remove", async (req, res) => {
  try {
    const { _id, date } = req.body;
    const addCompanyAdmin = await CM.findByIdAndUpdate({ _id: new Types.ObjectId(_id) }, {
      $pull: {
        Jobs: {
          date: new Date(date)
        }
      }
    })
    if (addCompanyAdmin) {
      res.json({ msg: "Post remove successfully", removed: true })
    } else {
      res.json({ msg: "Something went wrong!", removed: false })
    }
  } catch (error) {
    console.log(error);
    res.json({ msg: "Something went wrong!", removed: false });
  }
});
CR.post("/job/all", async (req, res) => {
  try {
    const { _id } = req.body
    const data = await CM.findById({ _id: new Types.ObjectId(_id) })
    res.json(data)

  } catch (error) {
    res.json({ msg: "Something went wrong!" })
  }
});
CR.post("/job/user", async (req, res) => {
  try {
    const { _id } = req.body
    const data = await UM.findById({ _id: new Types.ObjectId(_id) })
    res.json(data)

  } catch (error) {
    res.json({ msg: "Something went wrong!" })
  }
});
CR.post("/job/select", async (req, res) => {
  try {
    const { _id, applied_id, status, company_id, job_id, applicant_id } = req.body
    const updateUser = await UM.updateOne({ _id: new Types.ObjectId(_id), "appliedCompanies._id": new Types.ObjectId(applied_id) }, {
      $set: {
        "appliedCompanies.$.status": status
      }
    })

    const upadteCompany = await CM.updateOne(
      {
        _id: new Types.ObjectId(company_id),
        "Jobs._id": new Types.ObjectId(job_id),
        "Jobs.applicants._id": new Types.ObjectId(applicant_id)
      },
      {
        $set: {
          "Jobs.$[job].applicants.$[applicant].status": status
        },
      },
      {
        arrayFilters: [
          { "job._id": new Types.ObjectId(job_id) },
          { "applicant._id": new Types.ObjectId(applicant_id) }
        ]
      }
    )
    if (upadteCompany && updateUser) {
      res.json({ msg: "updated", updated: true })
    } else {
      res.json({ msg: "Something went wrong", updated: false })
    }

  } catch (error) {
    console.log(error);
    res.json({ msg: "Something went wrong!", updated: false })
  }
});
// CR.post("/update_job", async (req, res) => {
//   try {
//     const { title, requirements, content, offerStartPrice, offerEndPrice, duration, experinceStart, experinceEnd, workType, skills, date, ExtraBenifits, _id } = req.body;

//     const addJob = await CM.findByIdAndUpdate({ _id: new Types.ObjectId(_id) }, {
//       $push: {
//         Jobs: {
//           title, requirements, content, offerStartPrice, offerEndPrice, duration, experinceStart, experinceEnd, workType, skills, date, ExtraBenifits
//         }
//       }
//     })
//     if (addJob) {
//       res.json({ msg: "New post added successfully", created: true })
//     } else {
//       res.json({ msg: "Something went wrong!", created: false })
//     }
//   } catch (error) {
//     console.log(error);
//     res.json({ msg: "Something went wrong!", created: false })
//   }
// });


// Members

CR.post("/profile/update", async (req, res) => {
  try {
    const { _id, address, email, name, about, applicants, linkedin, phone, website, status, StartedAt } = req.body
    const add = await CM.updateOne({ _id: new Types.ObjectId(_id) }, {
      $set: {
        address, email, name, about, applicants, linkedin, phone, website, status: Number(status), StartedAt: new Date(StartedAt)
      }
    })
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

CR.post("/members/all", async (req, res) => {
  try {
    const { _id } = req.body
    const find = await CM.findById({ _id: new Types.ObjectId(_id) })
    res.json({ data: find.members })
  } catch (error) {
    res.json({ msg: "Something went wrong!" })
  }
})
CR.post("/members/add", async (req, res) => {
  try {
    const { userId, _id, roll, status, workingOn, JoinDate } = req.body
    const user = await UM.findByIdAndUpdate({ _id: new Types.ObjectId(userId), "Company.cid": cid }, {
      "Company.status": status,
      "Company.workingOn": workingOn,
      "Company.JoinDate": JoinDate,
      "Company.roll": roll

    })
    const Company = await CM.findByIdAndUpdate({ _id: new Types.ObjectId(_id), "members.userId": userId }, {
      $set: {
        "members.$.status": status,
        "members.$.roll": roll,
        "members.$.userId": userId,

      }
    })

    if (user && Company) {
      res.json({ msg: "Approved successfully", updated: true })
    } else {
      res.json({ msg: "Something went wrong!", updated: false })
    }
  } catch (error) {
    console.log(error);
    res.json({ msg: "Something went wrong!", updated: false })
  }
})
CR.post("/member/find", async (req, res) => {
  try {
    const { _id } = req.body
    const data = await UM.findById({ _id: new Types.ObjectId(_id) })
    res.json({ data })
  } catch (error) {
    res.json({ msg: "Something went wrong!" })
  }
})
// CR.post("/add_members", async (req, res) => {
//   try {
//     const { userId } = req.body
//     const user = await UM.findOne({ _id: userId })
//     res.json({ data: user })
//   } catch (error) {
//     console.log(error);
//     res.json({ msg: "Something went wrong!" })
//   }
// })


module.exports = CR;