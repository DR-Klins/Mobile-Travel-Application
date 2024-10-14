const express = require("express");
require("dotenv").config();
const app = express();


//custom error middleware for easy front end
const productionError = require("./middlewares/productionError");

//regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//import all routes here
const home = require("./routes/home");
const user = require("./routes/user");

//router middleware
app.use("/api/v1", home);
app.use("/api/v1", user);


app.get("/", (req, res) => {
  res.render("home");
});

//to handle production error
app.use(productionError);

// export app js
module.exports = app;
