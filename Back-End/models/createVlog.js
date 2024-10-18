const mongoose = require("mongoose");

const createVlogSchema = new mongoose.Schema({
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    format: { type: String },
    asset_id: { type: String },
    created_at: { type: Date, default: Date.now },
    resource_type: { type: String },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true }, // Assuming it references a Trip model
});

module.exports = mongoose.model("Vlog", createVlogSchema);
