const LocalStrategy =require('passport-local').Strategy
const User=require('../models/User')
const bcrypt=require('bcrypt')//using to compare hashpw

exports.init=(passport)=>{
    passport.use(new LocalStrategy({usernameField:'email'},async (email,password,done)=>{
        //defing the srategy and usernameField('emAIL) and getting all email and passwod from form
    //check if email exits
    
    const user=await User.findOne({email:email})//finding user with given email
    if(!user)
    {
        return done(null,false,{message:'No user with this email'})//theer is no user returning message will print on front end
    }
    bcrypt.compare(password,user.password).then(match=>//comparing password
    {
     if(match)
     {
         return done(null,user,{message:'logged in sucessfully'})
    //and this return will go too the authCon.js and postlogin method

     }
    return done(null,false,{message:'Wrong Password'})
    //and this return will go too the authCon.js and postlogin method


    }).catch(err=>
        {
            return done(null,false,{message:'Something went wrong'})
        })

}));
    passport.serializeUser((user,done)=>//storiing the whole user object in session  
    {
    done(null,user._id)//saving the user details into session through user._id 
    })  
    passport.deserializeUser((id, done) => {//getting all the information of user from id
        User.findById(id, (err, user) => {
            done(err, user)
        })
        
    })

}

exports.islogin=(req,res,next)=>{

    if(req.user){
        
        return next()
               }
               else{
            
                res.redirect('/login')
            }
    
}
exports.isrenter=(req,res,next)=>{
    if(req.user.role)
    {
        let ssn=req.session
        ssn.r_id=req.user._id
        if(req.user.role =='renter')
        {
            return next()
        }
        else{
            res.redirect('/')

        }
    }
    else{
        
        res.redirect('/login')
    }

    
}
exports.isrider=(req,res,next)=>{
    if(req.user.role)
    {
        let ssn=req.session
        ssn.r_id=req.user._id
        if(req.user.role =='rider')
        {
            return next()
        }
        else{
            res.redirect('/')

        }
    }
    else{
        
        res.redirect('/login')
    }

    
}

exports.isadmin=(req,res,next)=>{
    if(req.user.role)
    {
        let ssn=req.session
        ssn.r_id=req.user._id
        if(req.user.role =='admin')
        {
           next();

        }
        else{
            res.redirect('/')

        }
    }
    else{
        
        res.redirect('/login')
    }
   
}