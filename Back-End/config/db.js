/*const mongoose = require('mongoose');

const {MONGODB_URL} = process.env;

exports.connect = () => {

    mongoose.connect(MONGODB_URL, {

    })
    .then(
        console.log('DB CONNECTED SUCCESSFULLY')
    )
    .catch(error => {
        console.log('DB CONNECTION FAILED');
        console.log(error);
        process.exit(1)
    });
}*/

const mongoose = require("mongoose");

const connectWithDb = () => {
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(console.log(`DB GOT CONNECTED`))
    .catch((error) => {
      console.log(`DB CONNECTION ISSUES`);
      console.log(error);
      process.exit(1);
    });
};

module.exports = connectWithDb;
