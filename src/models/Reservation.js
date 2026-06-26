const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
{
    customerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Customer",
        required:true
    },

    roomId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Room",
        required:true
    },

    checkInDate:{
        type:Date,
        required:true
    },

    checkOutDate:{
        type:Date,
        required:true
    },

    adults:{
        type:Number,
        required:true
    },

    children:{
        type:Number,
        default:0
    },

    status:{
        type:String,

        enum:[
            "booked",
            "checked_in",
            "completed",
            "cancelled"
        ],

        default:"booked"
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},
{
    timestamps:true
}
);

module.exports = mongoose.model(
    "Reservation",
    reservationSchema
);