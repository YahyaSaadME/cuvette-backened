const mongoose = require("mongoose");

mongoose
  .connect(process.env.mongo)
  // .connect(`mongodb://127.0.0.1:27017/cuvette`)
  .then(() => console.log("DB Connected"))
  .catch((e) => {
    console.log(e);
  });
