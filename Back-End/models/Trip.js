const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({

    
    tripName: {
        type: String,
        required: [true, "Please provide Name of the trip"],
        maxlength: [40, "Type should be under 40 characters"],
      },

    tripType: {
      type: String,
      required: [true, "Please provide type of the trip"],
      maxlength: [40, "Type should be under 40 characters"],
    },
    budget: {
      type: String,
      required: [true, "Please provide your expected budget"],
    },
    destinations: [
      {
        destinationName: {
          type: String,
          required: [true, "Please provide a destination name"]
        },
        visited: {
          type: Boolean,
          default: false
        },
        time: {
          type: Date,
          default: null // Default can be null if left blank
        }
      }
    ],
    user_id: { // Reference to the User model
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please provide id of the user"],
      },
  });

  module.exports = mongoose.model("tripSchema", tripSchema);