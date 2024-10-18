import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  public_id: { 
    type: String, 
    required: true 
},
  url: { 
    type: String, required: true 
},
  format: { 
    type: String 
},
  asset_id: { 
    type: String 
},
  created_at: { 
    type: Date, default: Date.now 
},
  resource_type: { 
    type: String 
},
  destinationId: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Destination' 
}, 
});

const Media = mongoose.model('Media', MediaSchema);

export default Media;
module.exports = mongoose.model("tripSchema", tripSchema);