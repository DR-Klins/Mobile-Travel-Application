const mongoose = require("mongoose");

const createCutsSchema = new mongoose.Schema({
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    format: { type: String },
    asset_id: { type: String },
    created_at: { type: Date, default: Date.now },
    resource_type: { type: String },
    tripName:{type: String},
    tags: [String],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true }, // Assuming it references a Trip model
});

module.exports = mongoose.model("Cuts", createCutsSchema);
