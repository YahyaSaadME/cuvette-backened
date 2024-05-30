const express = require("express");
const AR = express.Router();
const AM = require("../model/AdminSchema");
const CM = require("../model/CompanySchema");
const path = require("path");
const fs = require('fs');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { Types } = require("mongoose");

const logo = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "Resources/logo/"); // Destination folder for uploaded files
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  }),
});
AR.use("/Companylogo", express.static(path.join(__dirname, "../Resources/logo/")));

const verification = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "Resources/verification/"); // Destination folder for uploaded files
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname)
      );
    },
  }),
});
AR.use(
  "/Companyverificationdocs",
  express.static(path.join(__dirname, "../Resources/verification/"))
);

// Main admin routes

AR.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email == "") {
      res.json({ msg: "Please fill all the fields!" });
    } else {
      const findbyEmail = await AM.findOne({ email });

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
            res.cookie("AAUAT", token, { httpOnly: true });
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
AR.post("/protected", (req, res) => {
  const token = req.body.token;
  if (!token) {
    return res.status(401).json({ msg: "Unauthorized" });
  }
  jwt.verify(token, process.env.token, (err, decoded) => {
    console.log(decoded);
    if (err) {
      return res.status(403).json({ msg: "Token validation failed" });
    }
    res.json({
      msg: "Access granted",
      name: decoded.name,
      id: decoded._id,
      regno: decoded.regno,
      email: decoded.email,
    });
  });
});


// Routes of Company CRUD 

AR.post("/addCompany", async (req, res) => {
  try {
    const { name, email, founder, about, statement, logo, docs } = req.body;
    if (
      name == "" ||
      founder == "" ||
      email == "" ||
      about == "" ||
      statement == "" ||
      logo == "" || docs == ""
    ) {
      res.json({ msg: "Please fill all the fields", created: false });
    } else {
      const findbyEmail = await CM.findOne({ email });
      if (!findbyEmail) {
        bcrypt.genSalt(Number(process.env.SaltNo), async (err, salt) => {
          if (err) {
            return res.status(500).json({ msg: "Something went wrong!", created: false });
          } else {
            const val = email + new Date().getTime();
            const combinedSalt = `${salt}${process.env.Salt}`;
            const hashedPassword = await bcrypt.hash(val, combinedSalt);
            const user = await CM.create({
              name,
              email,
              founder,
              about,
              statement,
              password: hashedPassword,
              cid: val,
              logo, docs,
              carousel: { img: null, },
              news: { head: null, },
              event: { title: null },
              status: true
            });
            if (user) {

              res.json({ msg: { id: val, created: true } });
            } else {
              res.json({ msg: "Something went wrong!", created: false });
            }
          }
        });
      } else {
        res.json({ msg: "Email already found!", created: false });
      }
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!", created: false });
  }
});
AR.post("/Companylogo", logo.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      res.json({ msg: "No file uploaded." })
    } else {
      res.json({ msg: "Done", path: req.file.filename })
    }

  } catch (error) {
    res.json({ msg: "SMO" })
  }
})
AR.post("/Companyverificationdocs", verification.single('verification'), async (req, res) => {
  try {
    if (!req.file) {
      res.json({ msg: "No file uploaded." })
    } else {
      res.json({ msg: "Done", path: req.file.filename })
    }

  } catch (error) {
    res.json({ msg: "SMO" })
  }
})
AR.post("/serachCompany", async (req, res) => {
  try {
    const { cid } = req.body
    const msg = await CM.findOne({ cid: cid })
    res.json(msg)
  } catch (error) {
    res.json({ msg: "SMO" })
  }
})
AR.get("/Company", async (req, res) => {
  try {
    const Company = await CM.find()
    res.json({ msg: Company })
  } catch (error) {
    res.json({ msg: "Something went wrong!" })
  }
})
AR.post("/disable_Company", async (req, res) => {
  try {
    const { cid, blocked } = req.body
    if (blocked) {
      const UpdateCM = await CM.findOneAndUpdate({ cid: cid }, { status: false })
      UpdateCM ? res.json({ msg: "Blocked successfully", updated: true }) : res.json({ msg: "Something went wrong", removed: false })
    } else {
      const UpdateCM = await CM.findOneAndDelete({ cid: cid })
      console.log(UpdateCM);
      const UpdateApprovedCarousel = await AM.findByIdAndUpdate({ _id: new Types.ObjectId("659c1a2211919f5bfb0a84e6") }, {
        $pull: {
          carousel: {
            cid: cid
          }
        }
      })
      const UpdateApprovedNews = await AM.findByIdAndUpdate({ _id: new Types.ObjectId("659c1a2211919f5bfb0a84e6") }, {
        $pull: {
          news: {
            cid: cid
          }
        }
      })
      if (UpdateCM && UpdateApprovedCarousel && UpdateApprovedNews) {
        const logoPath = path.join(__dirname, '../Resources/logo/', UpdateCM.logo);
        const verificationPath = path.join(__dirname, '../Resources/verification/', UpdateCM.docs);
        if (fs.existsSync(logoPath) && fs.existsSync(verificationPath)) {
          fs.unlinkSync(logoPath);
          fs.unlinkSync(verificationPath);
          res.json({ msg: "Removed successfully", updated: true })
        } else {
          res.json({ msg: "Something went wrong1!", updated: false })
        }
      } else {
        res.json({ msg: "Something went wrong", updated: false })
      }
    }
  } catch (error) {
    res.json({ msg: "Something went wrong", updated: false })
  }
})
AR.post("/activate_Company", async (req, res) => {
  try {
    const { cid } = req.body
    const UpdateCM = await CM.findOneAndUpdate({ cid: cid }, { status: true })
    UpdateCM ? res.json({ msg: "Activated successfully", updated: true }) : res.json({ msg: "Something went wrong", updated: false })


  } catch (error) {
    res.json({ msg: "Something went wrong", updated: false })
  }
})
AR.post("/getCompany", async (req, res) => {
  try {
    const { cid } = req.body
    const find = await CM.findOne({ cid: cid })
    if (find) {
      res.json({ data: find })
    } else {
      res.json({ data: null })
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!" })
  }
})

// Carousel
AR.get("/carousel_approval", async (req, res) => {
  try {
    const send = await AM.findOne({ _id: "659c1a2211919f5bfb0a84e6" })
    res.json({ msg: send.carousel })
    console.log(send.carousel);
  } catch (error) {
    res.json({ msg: "SMO" })
  }
})
AR.post("/approve_carousel", async (req, res) => {
  try {
    const { cid, position } = req.body
    const FindAM = await AM.findOne({ _id: "659c1a2211919f5bfb0a84e6" })
    let Found = false
    const TotalPositionsOccupied = [...new Set(FindAM.carousel.map(e => e.position))]
    TotalPositionsOccupied.map(e => e == position ? Found = true : false)

    const UpdateCM = await CM.findOneAndUpdate({ cid: cid }, {
      $set: { "carousel.approved": "Approved" }
    })
    const UpdateAM = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "carousel.cid": cid },
      {
        $set: { "carousel.$.approved": true, "carousel.$.position": position }
      },)
    console.log(Found);
    if (UpdateCM && UpdateAM) {
      if (Found) {
        console.log(UpdateCM && UpdateAM);
        res.json({ approved: false, change: true })
      } else {
        res.json({ msg: "Approved successfully.", approved: true })
      }
    } else {
      res.json({ msg: "Something went wrong!", approved: false })
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!", approved: false })
  }
})
AR.post("/decline_carousel", async (req, res) => {
  try {
    const { cid, remove } = req.body
    const UpdateCM = await CM.findOneAndUpdate({ cid: cid }, {
      $set: { "carousel.approved": remove ? "Time Up" : "Denied" }
    })
    const UpdateAM = await AM.findByIdAndUpdate({ _id: new Types.ObjectId("659c1a2211919f5bfb0a84e6") }, {
      $pull: {
        carousel: {
          cid: cid
        }
      }
    })
    if (UpdateCM && UpdateAM) {
      res.json({ msg: remove ? "Removed successfully." : "Denied successfully.", updated: true })
    } else {
      res.json({ msg: "Something went wrong!", updated: false })
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!", updated: false })
  }
})
AR.post("/change_carousel", async (req, res) => {
  try {
    const { cid, position, option, proceed } = req.body
    const FindAM = await AM.findOne({ _id: "659c1a2211919f5bfb0a84e6" })
    let Found = false
    const TotalPositionsOccupied = [...new Set(FindAM.carousel.map(e => e.position))]
    TotalPositionsOccupied.map(e => e == position ? Found = true : false)

    const common = async () => {
      try {
        const UpdateAM = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "carousel.cid": cid },
          {
            $set: { "carousel.$.position": position }
          },)
        UpdateAM ? res.json({ msg: `${Number(position) !== 0 ? `Updated to position no ${position}` : "Carousel removed successfully."}`, updated: true }) : res.json({ msg: "Something went wrong!", updated: false })
      } catch (error) {
        res.json({ msg: "Something went wrong!", updated: false })
      }
    }

    if (Found && proceed && position != 0) {
      if (option === 0) {
        const UpdateOld = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "carousel.position": position },
          {
            $set: { "carousel.$.position": 0 }
          },)
        const UpdateNew = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "carousel.cid": cid },
          {
            $set: { "carousel.$.position": position }
          },)
        UpdateOld && UpdateNew ? res.json({ msg: `Updated to position no ${position}`, updated: true }) : res.json({ msg: "Something went wrong!", updated: false })

      } else {
        const UpdateAM = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "carousel.position": position },
          {
            $set: { "carousel.$.position": Number(position) + 1 }
          },)
        UpdateAM ? common() : res.json({ msg: "Something went wrong!", updated: false })
      }
    }
    else if (Found && position != 0) {
      res.json({ msg: "already found", updated: false })
    }
    else { common() }

  } catch (error) {
    res.json({ msg: "Something went wrong!", updated: false })
  }
})

// News
AR.get("/news_approval", async (req, res) => {
  try {
    const send = await AM.findOne({ _id: "659c1a2211919f5bfb0a84e6" })
    res.json({ msg: send.news })
  } catch (error) {
    res.json({ msg: "SMO" })
  }
})
AR.post("/approve_news", async (req, res) => {
  try {
    const { cid, position } = req.body
    const FindAM = await AM.findOne({ _id: "659c1a2211919f5bfb0a84e6" })
    let Found = false
    const TotalPositionsOccupied = [...new Set(FindAM.news.map(e => e.position))]
    TotalPositionsOccupied.map(e => e == position ? Found = true : false)

    const UpdateCM = await CM.updateOne({ cid: cid }, {
      $set: { "news.approved": "Approved" }
    })
    const UpdateAM = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "news.cid": cid },
      {
        $set: { "news.$.approved": true, "news.$.position": Found ? 0 : position }
      },)
    if (UpdateCM && UpdateAM) {
      if (Found) {
        res.json({ approved: false, change: true })
      } else {
        res.json({ msg: "Approved successfully.", approved: true })
      }
    } else {
      res.json({ msg: "Something went wrong!", approved: false })
    }

  } catch (error) {
    res.json({ msg: "Something went wrong!", approved: false })
  }
})
AR.post("/decline_news", async (req, res) => {
  try {
    const { cid, removed } = req.body
    const UpdateCM = await CM.updateOne({ cid: cid }, {
      $set: { "news.approved": removed ? "Time Up" : "Denied" }
    })
    const UpdateAM = await AM.findByIdAndUpdate({ _id: new Types.ObjectId("659c1a2211919f5bfb0a84e6") }, {
      $pull: {
        news: {
          cid: cid
        }
      }
    })
    if (UpdateCM && UpdateAM) {
      res.json({ msg: removed ? "Removed successfully" : "Denied successfully.", denied: true })
    } else {
      res.json({ msg: "Something went wrong!", denied: false })
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!", denied: false })
  }
})
AR.post("/change_news", async (req, res) => {
  try {
    const { cid, position, option, proceed } = req.body
    const FindAM = await AM.findOne({ _id: "659c1a2211919f5bfb0a84e6" })
    let Found = false
    const TotalPositionsOccupied = [...new Set(FindAM.news.map(e => e.position))]
    TotalPositionsOccupied.map(e => e == position ? Found = true : false)

    const common = async () => {
      try {
        const UpdateAM = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "news.cid": cid },
          {
            $set: { "news.$.position": position }
          },)
        UpdateAM ? res.json({ msg: `${Number(position) !== 0 ? `Updated to position no ${position}` : "Carousel removed successfully."}`, updated: true }) : res.json({ msg: "Something went wrong!", updated: false })
      } catch (error) {
        res.json({ msg: "Something went wrong!", updated: false })
      }
    }

    if (Found && proceed && position != 0) {
      if (option === 0) {
        const UpdateOld = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "news.position": position },
          {
            $set: { "news.$.position": 0 }
          },)
        const UpdateNew = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "news.cid": cid },
          {
            $set: { "news.$.position": position }
          },)
        UpdateOld && UpdateNew ? res.json({ msg: `Updated to position no ${position}`, updated: true }) : res.json({ msg: "Something went wrong!", updated: false })

      } else {
        const UpdateAM = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "news.position": position },
          {
            $set: { "news.$.position": Number(position) + 1 }
          },)
        UpdateAM ? common() : res.json({ msg: "Something went wrong!", updated: false })
      }
    }
    else if (Found && position != 0) {
      res.json({ msg: "already found", updated: false })
    }
    else { common() }

  } catch (error) {
    res.json({ msg: "Something went wrong!", updated: false })
  }
})

//Events
AR.get("/events_approval", async (req, res) => {
  try {
    const send = await AM.findOne({ _id: "659c1a2211919f5bfb0a84e6" })
    res.json({ msg: send.events })
    console.log(send.events);
  } catch (error) {
    res.json({ msg: "Something went wrong!" })
  }
})
AR.post("/approve_events", async (req, res) => {
  try {
    const { cid, link, title, description, content, timeStart, timeEnd } = req.body
    const UpdateCM = await CM.findOneAndUpdate({ cid: cid }, {
      event: {
        link, title, description, timeStart, timeEnd,
        content, approved: "Approved"
      }
    })
    const UpdateAM = await AM.findOneAndUpdate({ _id: "659c1a2211919f5bfb0a84e6", "events.cid": cid },
      {
        $set: { "events.$.approved": true }
      },)
    if (UpdateCM && UpdateAM) {
      res.json({ msg: "Approved successfully.", approved: true })
    } else {
      res.json({ msg: "Something went wrong!", approved: false })
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!", approved: false })
  }
})
AR.post("/decline_events", async (req, res) => {
  try {
    const { cid, title, description, link, content, removed } = req.body
    const UpdateCM = await CM.findOneAndUpdate({ cid: cid }, {
      event: { title, description, link, content, approved: removed ? "Time Up" : "Denied" }
    })
    const UpdateAM = await AM.findByIdAndUpdate({ _id: new Types.ObjectId("659c1a2211919f5bfb0a84e6") }, {
      $pull: {
        events: {
          cid: cid
        }
      }
    })
    if (UpdateCM && UpdateAM) {
      res.json({ msg: removed ? "Removed successfully" : "Denied successfully.", denied: true })
    } else {
      res.json({ msg: "Something went wrong!", denied: false })
    }
  } catch (error) {
    res.json({ msg: "Something went wrong!", denied: false })
  }
})


module.exports = AR;