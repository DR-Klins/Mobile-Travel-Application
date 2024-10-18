const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  logout,
  forgotPassword,
  passwordReset,
  getLoggedInUserDetails,
  changePassword,
  updateUserDetails,
  adminAllUser,
  managerAllUser,
  admingetOneUser,
  adminUpdateOneUserDetails,
  adminDeleteOneUser,
  createTrip,
  getTrips,
  getTripDetails,
  updateVisited,
  saveMedia,
  createItinerary,
  createVlog,
  createCuts,
} = require("../controllers/userController");
const { isLoggedIn, customRole } = require("../middlewares/user");

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/forgotPassword").post(forgotPassword);
router.route("/password/reset/:token").put(passwordReset);
router.route("/userdashboard").get(isLoggedIn, getLoggedInUserDetails);
router.route("/password/update").put(isLoggedIn, changePassword);
router.route("/userdashboard/update").put(isLoggedIn, updateUserDetails);
router.route("/createTrip").post(createTrip);
router.route("/getTrips").post(getTrips);
router.route("/getTripDetails").post(getTripDetails);
router.route("/updateVisited").post(updateVisited);
router.route("/saveMedia").post(saveMedia);
router.route("/createItinerary").post(createItinerary);
router.route("/createVlog").post(createVlog);
router.route("/createCuts").post(createCuts);


//admin only routes
router.route("/admin/users").get(isLoggedIn, customRole("admin"), adminAllUser);
router
  .route("/admin/user/:id")
  .get(isLoggedIn, customRole("admin"), admingetOneUser)
  .put(isLoggedIn, customRole("admin"), adminUpdateOneUserDetails)
  .delete(isLoggedIn, customRole("admin"), adminDeleteOneUser);

// manager only route
router
  .route("/manager/users")
  .get(isLoggedIn, customRole("manager"), managerAllUser);
module.exports = router;
