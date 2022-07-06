const mongoose=require('mongoose')
const sc=mongoose.Schema({
    r_id:{type:Object,required:true},
    VehicleName:{type:String,required:true},
    Type:{type:Number,required:true},
    Gear: {type: String,required:true},
    Model:{type:String,required:true},
    Fuel:{type:String,required:true},
    Travelled:{type:Number,required:true},
    Mileage:{type:Number,required:true},
    VehicleNumber:{type:Number,required:true},
    image:{type:String,required:true},
    booked:{type:Boolean,default:false,required:true}
});
const Model=mongoose.model('VehicleInfo',sc);
module.exports=Model