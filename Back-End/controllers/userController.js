const User = require("../models/user");
const Trip = require("../models/Trip");
const Itinerary  = require("../models/createItinerary");
const Cuts = require("../models/createCuts")
const Vlog = require("../models/createVlog");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const cookieToken = require("../utils/cookieToken");
const mailHelper = require("../utils/emailHelper");
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {
  
  console.log(req.body);

  const { name, email, password } = req.body;

  if (!email || !name || !password) {
    return next(new CustomError("Name, email and password are required", 400));
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;

  // check for presence of email and password
  if (!email || !password) {
    return next(new CustomError("please provide email and password", 400));
  }

  // get user from DB
  const user = await User.findOne({ email }).select("+password");

  // if user not found in DB
  if (!user) {
    return next(
      new CustomError("Email or password does not match or exist", 400)
    );
  }

  // match the password
  const isPasswordCorrect = await user.isValidatedPassword(password);

  //if password do not match
  if (!isPasswordCorrect) {
    return next(
      new CustomError("Email or password does not match or exist", 400)
    );
  }

  // if all goes good and we send the token
  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  //clear the cookie
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  //send JSON response for success
  res.status(200).json({
    succes: true,
    message: "Logout success",
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  // collect email
  const { email } = req.body;
  console.log(email);
  // find user in database
  const user = await User.findOne({ email });

  // if user not found in database
  if (!user) {
    return next(new CustomError("Email not found as registered", 400));
  }

  //get token from user model methods
  const forgotToken = user.getForgotPasswordToken();

  console.log(forgotToken)

  // save user fields in DB
  await user.save({ validateBeforeSave: false });

  // create a URL
  // const myUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/password/reset/${forgotToken}`;

  //URL for deployment as front end might be running at different URL
  const myUrl = `${process.env.FRONT_END}/password/reset/${forgotToken}`;

  // craft a message
  const message = `Copy paste this link in your URL and hit enter \n\n ${myUrl}`;

  // attempt to send email
  try {
    await mailHelper({
      email: user.email,
      subject: "LCO TStore - Password reset email",
      message,
    });

    // json reponse if email is success
    res.status(200).json({
      succes: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    // reset user fields if things goes wrong
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // send error response
    return next(new CustomError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  //get token from params
  const token = req.params.token;

  // hash the token as db also stores the hashed version
  const encryToken = crypto.createHash("sha256").update(token).digest("hex");

  // find user based on hased on token and time in future
  const user = await User.findOne({
    encryToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("Token is invalid or expired", 400));
  }

  // check if password and conf password matched
  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new CustomError("password and confirm password do not match", 400)
    );
  }

  // update password field in DB
  user.password = req.body.password;

  // reset token fields
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;

  // save the user
  await user.save();

  // send a JSON response OR send token

  cookieToken(user, res);
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  //req.user will be added by middleware
  // find user by id
  const user = await User.findById(req.user.id);

  //send response and user data
  res.status(200).json({
    success: true,
    user,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  // get user from middleware
  const userId = req.user.id;

  // get user from database
  const user = await User.findById(userId).select("+password");

  //check if old password is correct
  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  if (!isCorrectOldPassword) {
    return next(new CustomError("old password is incorrect", 400));
  }

  // allow to set new password
  user.password = req.body.password;

  // save user and send fresh token
  await user.save();
  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  // add a check for email and name in body

  // collect data from body
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };

  // if photo comes to us
  if (req.files) {
    const user = await User.findById(req.user.id);

    const imageId = user.photo.id;

    // delete photo on cloudinary
    const resp = await cloudinary.v2.uploader.destroy(imageId);

    // upload the new photo
    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );

    // add photo data in newData object
    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }

  // update the data in user
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminAllUser = BigPromise(async (req, res, next) => {
  // select all users
  const users = await User.find();

  // send all users
  res.status(200).json({
    success: true,
    users,
  });
});

exports.admingetOneUser = BigPromise(async (req, res, next) => {
  // get id from url and get user from database
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new CustomError("No user found", 400));
  }

  // send user
  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
  // add a check for email and name in body

  // get data from request body
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  // update the user in database
  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  // get user from url
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError("No Such user found", 401));
  }

  // get image id from user in database
  const imageId = user.photo.id;

  // delete image from cloudinary
  await cloudinary.v2.uploader.destroy(imageId);

  // remove user from databse
  await user.remove();

  res.status(200).json({
    success: true,
  });
});

exports.managerAllUser = BigPromise(async (req, res, next) => {
  // select the user with role of user
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});

exports.createTrip = BigPromise(async (req, res, next) => {

  // Log the request body for debugging
  console.log(req.body);

  // Destructure trip details from request body
  const { tripName, tripType, user_id, budget, destinations } = req.body;

  // Check if all required fields are provided
  if (!tripName || !user_id || !tripType || !budget || !destinations || destinations.length === 0) {
    return next(new CustomError("Trip type, budget, and at least one destination are required", 400));
  }

  // Create a new trip in the database
  const trip = await Trip.create({
    tripName,
    tripType,
    user_id,
    budget,
    destinations,
  });

  // Respond with success message and the created trip
  res.status(201).json({
    success: true,
    message: "Trip created successfully",
    trip,
  });
});


exports.getTrips = BigPromise(async (req, res, next) => {
  // Log the request body for debugging
  console.log(req.body);

  // Destructure trip details from request body
  const { user_id } = req.body;

  // Check if user_id is provided (ensure it is not null or undefined)
  if (!user_id) {
    return next(new CustomError("User ID required", 400));
  }

  try {
    // Fetch trips for the authenticated user by the correct field name 'user_id'
    const trips = await Trip.find({ user_id: user_id });

    // Check if the user has trips
    if (!trips.length) {
      return res.status(404).json({
        success: false,
        message: "No trips found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      trips,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


exports.getTripDetails = BigPromise(async (req, res, next) => {
  // Log the request params for debugging
  console.log(req.body);

  // Destructure trip ID from request parameters
  const { trip_id } = req.body;

  // Check if trip_id is provided
  if (!trip_id) {
    return next(new CustomError("Trip ID required", 400));
  }

  try {
    // Fetch the trip details using the trip ID
    const trip = await Trip.findById(trip_id);

    // Check if the trip exists
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


exports.updateVisited = BigPromise(async (req, res, next) => {
  console.log(req.body);

  const { tripId, destinationName } = req.body;

  if (!tripId || !destinationName) {
    return next(new CustomError("Trip ID and Destination Name are required", 400));
  }

  try {
    // Update all occurrences of the destination with the same name
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: tripId, 'destinations.destinationName': destinationName },
      {
        $set: { 'destinations.$[elem].visited': true },
      },
      {
        arrayFilters: [{ 'elem.destinationName': destinationName }],
        new: true, // Return the updated document after the operation
        multi: true, // Ensure all matching documents are updated
      }
    );

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: "Trip or destination not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All matching destinations marked as visited.",
      updatedTrip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.saveMedia = BigPromise(async (req, res, next) => {
  const { tripId, destinationName, media } = req.body;

  // Validate the incoming data
  if (!tripId || !destinationName || !media) {
    return next(new CustomError("Trip ID, Destination Name, and Media are required", 400));
  }

  try {
    // Find the trip and push new media to the destination
    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: tripId, 'destinations.destinationName': destinationName },
      {
        $push: {
          'destinations.$[elem].media': { $each: media },
        },
      },
      {
        arrayFilters: [{ 'elem.destinationName': destinationName }],
        new: true, // Return the updated document
      }
    );

    // If no trip or destination is found
    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: "Trip or destination not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media saved successfully to the destination.",
      updatedTrip,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error saving media to database: ${error.message}`,
    });
  }
});


exports.createItinerary = BigPromise(async (req, res, next) => {
  console.log(req.body);

  const { q1, q2, q3, q4, q5, q6, q7, q8, q9, tripId } = req.body;

  try {
    // Create a new itinerary in the database
    const newItinerary = await Itinerary.create({ // Change this line
      q1, q2, q3, q4, q5, q6, q7, q8, q9, tripId
    });

    return res.status(200).json({
      success: true,
      message: "Itinerary Created",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Error creating Itinerary: ${error.message}`,
    });
  }
});

exports.createVlog = BigPromise(async (req, res, next) => {
  const { public_id, url, format, asset_id, resource_type, tripId } = req.body;

  try {
      // Create a new vlog in the database
      const newVlog = await Vlog.create({
          public_id,
          url,
          format,
          asset_id,
          resource_type,
          tripId,
      });

      return res.status(200).json({
          success: true,
          message: "Vlog Created",
          data: newVlog, // Optionally return the created vlog
      });
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: `Error creating Vlog: ${error.message}`,
      });
  }
});


exports.createCuts = BigPromise(async (req, res, next) => {
  const { public_id, url, format, asset_id, resource_type, tripId } = req.body;

  try {
      // Create a new vlog in the database
      const newVlog = await Cuts.create({
          public_id,
          url,
          format,
          asset_id,
          resource_type,
          tripId,
      });

      return res.status(200).json({
          success: true,
          message: "Vlog Created",
          data: newVlog, // Optionally return the created vlog
      });
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: `Error creating Vlog: ${error.message}`,
      });
  }
});