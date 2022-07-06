const mongoose=require('mongoose');
const Sc=mongoose.Schema({
    r_id:{type:Object,required:true},
    TotalIncome:{type:Number,default:0}
})
const Income=mongoose.model('income',Sc)
module.exports=Income