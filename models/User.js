const mongoose=require('mongoose');
const Sc=mongoose.Schema({
    username:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true},
    role:{type:String,required:true}
})
const Model=mongoose.model('userData',Sc)
module.exports=Model