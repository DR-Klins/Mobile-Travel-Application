const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  tripName: {
    type: String,
    required: [true, "Please provide Name of the trip"],
    maxlength: [40, "Name should be under 40 characters"],
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
        required: [true, "Please provide a destination name"],
      },
      visited: {
        type: Boolean,
        default: false,
      },
      media: [
        {
          public_id: {
            type: String,
            required: [true, "Please provide the Cloudinary public ID"],
          },
          url: {
            type: String,
            required: [true, "Please provide the media URL"],
          },
          resource_type: {
            type: String, // e.g., image or video
            required: [true, "Please provide the type of media (image/video)"],
          },
          format: {
            type: String, // e.g., jpg, mp4
            required: [true, "Please provide the media format"],
          },
          uploaded_at: {
            type: Date,
            default: Date.now, // Automatically store the upload date
          },
        },
      ],
    },
  ],
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Please provide id of the user"],
  },
});

module.exports = mongoose.model("tripSchema", tripSchema);
