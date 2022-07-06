const mongoose=require('mongoose')
const sc=mongoose.Schema({
    user_id:{type:Object,required:true},
    r_id:{type:Object,required:true},

    booked_vehicle:{type:Object,required:true},
    time:{type:Number,required:true},
    bill:{type:Number,required:true},
    status:{type:String,required:true,default:"Pending"},
    location:{type:String,required:true},
    mobile:{type:Number,required:true}
}, { timestamps: true })//storing time;

const Order=mongoose.model('order',sc);
module.exports=Order