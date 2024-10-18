const mongoose = require("mongoose");

const createItinerary = new mongoose.Schema({
    q1: { 
        type: String, 
    },
    q2: { 
        type: String,
    },
    q3: { 
        type: String 
    },
    q4: { 
        type: String 
    },
    q5: { 
        type: String,
    },
    q6: { 
        type: String 
    },
    q7: { 
        type: String 
    },
    q8: { 
        type: String 
    },
    q9: { 
        type: String 
    },
    tripId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Destination'
    }, 
});

module.exports = mongoose.model("createItinerary", createItinerary);