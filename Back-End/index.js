const app = require("./app");
/*const {PORT} = process.env;*/
const connectWithDb = require("./config/db");
require("dotenv").config();

// connect with databases
connectWithDb();

app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`Server is running at port: ${process.env.PORT}`);
  });