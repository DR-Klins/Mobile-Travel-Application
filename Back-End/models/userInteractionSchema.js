const mongoose = require("mongoose");

const userInteractionSchema = new mongoose.Schema({
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cuts' }],
    watchedVideos: [{ videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cuts' }, watchTime: Number }]
});

module.exports = mongoose.model("userInteraction", userInteractionSchema);
