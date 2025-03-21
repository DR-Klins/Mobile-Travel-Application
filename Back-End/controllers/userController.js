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
const VlogModel = require("../models/createVlog");
const getItinerary = require("../models/createItinerary");
const getCuts = require("../models/createCuts");
const getUsers = require("../models/user");
const userInteraction = require("../models/userInteractionSchema")
const { log } = require("console");


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
  const { public_id, url, format, asset_id, resource_type, tripName, tripId } = req.body;

  try {
      // Create a new vlog in the database
      const newCuts = await Cuts.create({
          public_id,
          url,
          format,
          asset_id,
          resource_type,
          tripName,
          tripId,
      });

      return res.status(200).json({
          success: true,
          message: "Cuts Created",
          data: newCuts, // Optionally return the created vlog
      });
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: `Error creating Cuts: ${error.message}`,
      });
  }
});

exports.getVlog = BigPromise(async (req, res, next) => {
  // Log the request params for debugging
  console.log(req.body);

  // Destructure trip ID from request parameters
  const { trip_id } = req.body;

  // Check if trip_id is provided
  if (!trip_id) {
    return next(new CustomError("Trip ID required", 400));
  }

  try {
    // Check if the trip exists
    const tripExists = await Trip.findById(trip_id);
    if (!tripExists) {
      return next(new CustomError("Trip ID not found", 404));
    }

    // Fetch the vlog using the trip ID
    const vlog = await VlogModel.findOne({ tripId: trip_id }); // Use tripId to find the vlog

    // Check if the vlog exists
    if (!vlog) {
      return res.status(404).json({
        success: false,
        message: "Vlog not found",
      });
    }

    return res.status(200).json({
      success: true,
      vlog, // Return the fetched vlog
    });
  } catch (error) {
    console.error("Database error:", error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


exports.getVlog = BigPromise(async (req, res, next) => {
  // Log the request params for debugging
  console.log(req.body);

  // Destructure trip ID from request parameters
  const { trip_id } = req.body;

  // Check if trip_id is provided
  if (!trip_id) {
    return next(new CustomError("Trip ID required", 400));
  }

  try {
    // Check if the trip exists
    const tripExists = await Trip.findById(trip_id);
    if (!tripExists) {
      return next(new CustomError("Trip ID not found", 404));
    }

    // Fetch the vlog using the trip ID
    const vlog = await VlogModel.findOne({ tripId: trip_id }); // Use tripId to find the vlog

    // Check if the vlog exists
    if (!vlog) {
      return res.status(404).json({
        success: false,
        message: "Vlog not found",
      });
    }

    return res.status(200).json({
      success: true,
      vlog, // Return the fetched vlog
    });
  } catch (error) {
    console.error("Database error:", error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.getItinerary = BigPromise(async (req, res, next) => {
  // Log the request params for debugging
  console.log(req.body);

  // Destructure trip ID from request parameters
  const { trip_id } = req.body;

  // Check if trip_id is provided
  if (!trip_id) {
    return next(new CustomError("Trip ID required", 400));
  }

  try {
    // Check if the trip exists
    const tripExists = await Trip.findById(trip_id);
    if (!tripExists) {
      return next(new CustomError("Trip ID not found", 404));
    }

    // Fetch the vlog using the trip ID
    const itinerary = await getItinerary.findOne({ tripId: trip_id }); // Use tripId to find the vlog

    // Check if the vlog exists
    if (!itinerary) {
      return res.status(404).json({
        success: false,
        message: "Vlog not found",
      });
    }

    return res.status(200).json({
      success: true,
      itinerary, // Return the fetched vlog
    });
  } catch (error) {
    console.error("Database error:", error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.getCuts = BigPromise(async (req, res, next) => {
  // Log the request params for debugging
  console.log(req.body);

  // Destructure user ID from request parameters
  const { user_id } = req.body;

  // Check if user_id is provided
  if (!user_id) {
    return next(new CustomError("User ID required", 400));
  }

  try {
    // Check if the user exists
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return next(new CustomError("User not found", 404));
    }

    // Step 1: Fetch all trips associated with the user
    const trips = await Trip.find({ user_id: user_id }).select('_id');
    
    // If no trips found, return an empty array
    if (trips.length === 0) {
      return res.status(200).json({
        success: true,
        cuts: [], // Return an empty array if no trips found
      });
    }

    // Step 2: Fetch cuts associated with the user's trips
    const tripIds = trips.map(trip => trip._id); // Get trip IDs
    console.log("tripid:",  tripIds)
    const cuts = await getCuts.find({ tripId: { $in: tripIds } });

    // Return the fetched cuts
    return res.status(200).json({
      success: true,
      cuts,
    });
  } catch (error) {
    console.error("Database error:", error); // Log the error for debugging
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

exports.searchUsersAndCuts = BigPromise(async (req, res, next) => {
  // Log the request body for debugging
  console.log(req.body);

  // Destructure search term from request body
  const { query } = req.body;

  // Check if query term is provided
  if (!query) {
      return next(new CustomError("Search term required", 400));
  }

  try {
      // Find users whose usernames match the query, case-insensitive
      const users = await User.find({ name: { $regex: query, $options: 'i' } });

      // Find cuts whose titles match the query, case-insensitive
      const cuts = await getCuts.find({ tripName: { $regex: query, $options: 'i' } });

      // If no users or cuts are found, return a 404 status with a message
      if (!users.length && !cuts.length) {
          return res.status(404).json({
              success: false,
              message: "No results found for this search term",
          });
      }

      return res.status(200).json({
          success: true,
          users,
          cuts,
      });
  } catch (error) {
      return res.status(500).json({
          success: false,
          message: error.message,
      });
  }
});

exports.getRecommendedVideos = BigPromise(async (user_id) => {
  try {
      const user = await User.findById(user_id)
          .populate('likedCuts')
          .populate('watchedCuts._id')
          .populate('following');

      if (!user) {
          throw new CustomError('User not found', 404);
      }

      const tags = [];
      user.likedCuts.forEach(video => tags.push(...video.tags));

      user.watchedCuts.forEach(watched => {
          if (watched._id && Array.isArray(watched._id.tags)) {
              tags.push(...watched._id.tags);
          }
      });

      // Get content-based recommendations
      let contentBasedCuts = await Cuts.find({
          tags: { $in: tags },
          _id: { $nin: user.likedCuts.map(v => v._id).concat(user.watchedCuts.map(v => v._id)) }
      }).limit(10);

      // If not enough content-based recommendations, fetch trending
      if (contentBasedCuts.length < 10) {
          const trendingCuts = await Cuts.find({
              _id: { $nin: user.likedCuts.map(v => v._id).concat(user.watchedCuts.map(v => v._id)) }
          }).sort({ likes: -1, views: -1 }).limit(10 - contentBasedCuts.length);

          contentBasedCuts = [...contentBasedCuts, ...trendingCuts];
      }

      // If still not enough, show random videos that the user hasn't watched
      if (contentBasedCuts.length < 10) {
          const remainingVideos = await Cuts.find({
              _id: { $nin: user.likedCuts.map(v => v._id).concat(user.watchedCuts.map(v => v._id)) }
          }).limit(10 - contentBasedCuts.length);

          // Shuffle remaining videos to add some randomness
          const shuffledRemainingVideos = remainingVideos.sort(() => 0.5 - Math.random()).slice(0, 10 - contentBasedCuts.length);
          contentBasedCuts = [...contentBasedCuts, ...shuffledRemainingVideos];
      }

      return contentBasedCuts;
  } catch (error) {
      console.error('Error getting recommended Cuts:', error);
      throw new CustomError('Failed to get recommended Cuts', 500);
  }
});



exports.incrementVideoViews = BigPromise(async (req, res, next) => {
  // Log the request params for debugging
  console.log(req.body);
  try {

    const { _id, user_id } = req.body;

    console.log('Incoming _id:', _id);
    console.log('Incoming user_id:', user_id);

    // Check if the video exists
    const video = await Cuts.findById(_id);
    if (!video) {
      console.log('video not found');
      throw new CustomError('Video not found', 404);
    }

    // Increment the view count for the video
    await Cuts.findByIdAndUpdate(_id, {
      $inc: { views: 1 } // Increment the 'views' field by 1
    });

    // Check if the user exists
    const user = await User.findById(user_id);
    if (!user) {
      console.log('user not found');
      throw new CustomError('user not found', 404);
    }
    
      // store the video watch history for the user
      await User.findByIdAndUpdate(user_id, {
        $addToSet: { 'watchedCuts': { _id, watchTime: 0 } } // Add videoId to watchedVideos if not already present
      });

    return res.status(200).json({
      success: true,
      message: "View count incremented and watch history created",
    });


    //console.log('View count incremented and watch history updated');
  } catch (error) {
    console.error('Error incrementing video views:', error);
    throw new CustomError('Failed to increment video views', 500);
  }
});



exports.likeVideo = BigPromise(async (req, res, next) => {

  console.log(req.body);

  try {
    const { _id, user_id } = req.body;


    
    // Check if the video exists
    const video = await Cuts.findById(_id);
    if (!video) {
      console.log('video not found');
      throw new CustomError('Video not found', 404);
    }

      // Add the user ID to the 'likes' array of the video
      await Cuts.findByIdAndUpdate(_id, {
          $addToSet: { likes: user_id }  // Add userId to likes array if not already present
      });

      // Optionally, also update the user's liked videos list
      await User.findByIdAndUpdate(user_id, {
          $addToSet: { likedCuts: _id }  // Add videoId to the user's likedVideos array
      });
      
      console.log('Video liked successfully');
      return res.status(200).json({
        success: true,
        message: "View count incremented and watch history created",
      });


  } catch (error) {
      console.error('Error liking video:', error);
      throw new CustomError('Failed to like video', 500);
  }
});

