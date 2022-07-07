require('dotenv').config()//this will inject .env variable into this file

const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session');
const MongoDbSession = require('connect-mongodb-session')(session)
const UserModel = require('./models/User')
const vehicleModel = require('./models/renter/Vehicle')
const Order = require('./models/booker/order')
const passport = require('passport');
const flash = require('express-flash');
const { init } = require('./Authentication/passport');
const { islogin, isrenter, isadmin,isrider } = require('./Authentication/passport');
const multer = require('multer');
const bcrypt=require('bcrypt')//using to compare hashpw
var validator = require('validator');
const Emitter=require('events');//this is used to emit events
const moment=require('moment');
const { json } = require('express');

const app = express();
const publicDir = path.join(__dirname,'/public'); 
app.use(express.static(publicDir)); 
// app.use(express.static(__dirname + '/public'))
// app.use('public', express.static)//setting public folder as static which means compiler will look all the js and front end fiels in public folder by default
//app.set('views', path.join(__dirname, '/views'))//setting up all the frontend file
app.use(express.urlencoded({ extended: true }));//so we can accces the form input values
app.use(express.json())

app.use(expressLayouts);
app.set('layout', './pages/layout.ejs');
app.set('view engine', 'ejs')

mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(() => console.log("data base is connected")).catch((err) => console.log(err + "ererer"))

const store = new MongoDbSession({
    uri: process.env.MONGO_CONNECTION_URL,
    collection: 'authSession'
})
const eventEmitter = new Emitter() //setting up the event emiter 
app.set('eventEmitter',eventEmitter)

app.use(session({
    secret:process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
}))
app.use((req,res,next)=>{
    res.locals.session=req.session//by req .session we will get the running  session
    res.locals.user=req.user
        next();//must to call to get next step of execution

})
init(passport)
app.use(passport.initialize())
app.use(passport.session())
app.use(flash());
// require('./')
var fileStorage = multer.diskStorage({
    destination: "./public/images/",
    filename: (req, file, cb) => {
        cb(null,file.fieldname+ "_" + Date.now() + path.extname(file.originalname));
    }
});
var upload = multer({ 
    storage: fileStorage 
}).single('image');


app.get('/dashboard', isadmin, (req, res) => {
    res.render('admin/dashboard', {title: 'Admin Dashboard',})
})
app.get('/dashboard/manage-orders', isadmin, async (req, res) => {
    var orders = await Order.find({ status: { $ne: 'Completed' } }, null, { sort: { 'createdAt': -1 }})

    res.render('admin/orders', { title: 'Manage Orders', order: orders,moment:moment })
})
app.post('/updateStatus', isadmin,async (req, res) => {
    let data = JSON.parse(req.body.id)
   let data2= JSON.parse(req.body.Vehicle)
 console.log(req.body.id)
if(req.body.status == 'Completed'){
   let doc= await vehicleModel.findByIdAndUpdate({_id:data2},{booked:false})
}
    await Order.findByIdAndUpdate({ _id: data }, { status: req.body.status}, (err, done) => {
    
        if (!err) {
           eventEmitter.emit('orderUpdated',{id:data,status:req.body.status})
        //   const respon  =await fast2sms.sendMessage({authorization:'fL9z4MtYXqZSINrClmcHA20yu8PnRg3TpQDVewUEsa5BkoFhxJv7yepm9WnwtioBUZrLals3NRPIjH2k',message:`Namaste Rider Your Order Status is ${req.body.status}`,numbers:['9928525911']}) //Asynchronous Function.
            res.redirect('/dashboard/manage-orders')
        }
        else{
            console.log(err)
        }
    })
})

app.get('/dashboard/manage-vehicles', isadmin, async (req, res) => {
let data = await vehicleModel.find()
    res.render('admin/vehicles', { title: 'Manage Vehicles',data: data })
})

app.get('/dashboard/manage-users', isadmin, async (req, res) => {
    let data = await UserModel.find()

    res.render('admin/users', { title: 'Manage Users',data: data })
})
app.get('/dashboard/delete/:id', isadmin, async (req, res) => {
    await vehicleModel.findByIdAndDelete({ _id: req.params.id })
    res.redirect('/dashboard/manage-vehicles')
})
app.get('/dashboard/delete/user/:id', isadmin, async (req, res) => {
    await UserModel.findByIdAndDelete({ _id: req.params.id })
    res.redirect('/dashboard/manage-users')
})

app.get('/profile', islogin, (req, res) => {
    res.send("you are logged in")
})

// Renter Routes
app.get('/renter-profile/add-vehicle', islogin, isrenter, (req, res) => {

    res.render('renter/add-vehicle', {title: 'Add Vehicle', data: "hello" })
})

app.post('/renter-profile/add-vehicle', islogin, isrenter, upload, async (req, res) => {
    const { vehicleName, type, gear, model, vehicleNumber, fuel, travelled,mileage } = req.body
    if(!vehicleName || !type || !vehicleNumber || !gear| !model || !fuel || !travelled || !mileage) {
        req.flash('error', 'All fields are required')
        return res.redirect('/renter-profile/add-vehicle')
    }
    let exits = await vehicleModel.findOne({ vehicleNumber })
    if (exits) {
        req.flash('error','A Vehicle is Already Rented with this number') 

        res.render('renter/add-vehicle', {title: 'Add Vehicle'})
    }
    else {
        let newVehicle = new vehicleModel({
            r_id: req.session.r_id,
            VehicleName: vehicleName,
            Type: type,
            Gear: gear,
            Model:model,
            Fuel:fuel,
            Travelled:travelled,
            Mileage:mileage,
            VehicleNumber: vehicleNumber,
            image: req.file.filename
        })
        newVehicle.save().then(() => res.redirect('/renter-profile')).catch((err) => console.log(err))
    }
})

app.get('/renter-profile/update/:id', islogin, isrenter, async (req, res) => {
    
    let data = await vehicleModel.findOne({ _id: req.params.id })
    res.render('renter/update-vehicle', { title: 'Update Vehicle', data: data })
})

app.post('/renter-profile/update', islogin, isrenter, upload, async (req, res) => {
    console.log(req.body)
    var id = JSON.parse(req.body.id)
    console.log(id);

    await vehicleModel.findByIdAndUpdate({ _id: id }, req.body, { new: true }, (err, doc) => {
        if (!err) {
            res.redirect('/renter-profile');
        }
        else {
            console.log("can not update data");
        }
    })
})

app.get('/renter-profile/delete/:id', islogin, isrenter, async (req, res) => {
    let data = await vehicleModel.findById({ _id: req.params.id })
    if (data.booked == true) {

        res.send("You can not Delete A Booked Vehicle")
    }
    else {

        await vehicleModel.findByIdAndDelete({ _id: req.params.id })
        res.redirect('/renter-profile')
    }
})

app.get('/renter-profile', islogin, isrenter, async (req, res) => {
var owners=[]
var duration=[]
    let list = await vehicleModel.find({ r_id: req.session.r_id })
   let id=String(req.session.r_id)
    let ownerOrder=await Order.find({r_id:id})
    for (let i = 0; i < ownerOrder.length; i++) {
        let data=await UserModel.findOne({_id:ownerOrder[i].user_id})
        // console.log(data)
        owners[i]=data.username
        duration[i]=ownerOrder[i].time;
    }
    res.render('renter/renter-profile', { title : 'Renter Profile', data: list,owners:owners,duration:duration})
});


const _getRedirect=(req)=>
  {
    if (req.user.role == 'admin') {
        req.session.role='admin'
    
        return '/dashboard'
        }
        else if (req.user.role == 'renter') {
            req.session.role='renter'
                return '/renter-profile'
       
        }
        else {
            req.session.role='rider'
            return '/rider-profile'
        }
    
  }

app.get('/login', (req, res) => {
    res.render('login', {title: 'Login'})
})

app.post('/login', (req, res) => 
{ 
    const { email, password }   = req.body
    // Validate request 
     if(!email || !password) {
         req.flash('error', 'All Fields are required')
         return res.redirect('/login')
     } 
     passport.authenticate('local',(err,user,info)=>//this will call the init function in passport js
       {

        if(err)
        {
          req.flash('error', info.message )
          return next(err) ;
        }
        if(!user)
        {
          req.flash('error', info.message )

          return res.redirect('/login')

        }
        req.login(user,(err)=>{//deserialixeing user here 
          if(err)
          {
            req.flash('error', info.message ) 
            console.log("errore")
            return next(err)

          }
          
          return res.redirect(_getRedirect(req))//calling function to check the role
        })
       })(req,res)
})
app.post('/logout',(req,res)=>{
    req.logout();
    delete req.session.role
  res.redirect('/');
})
// Home Route
app.get('/',(req,res)=>{
    res.render('home', {title: 'Rent & Ride'})
})

app.get('/register/:role',(req,res)=>{
    let role=req.params.role
    res.render('register',{title: 'Register', role:role})
})

app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body
    // Validate request 
    if(!username || !email || !password) {
        req.flash('error', 'All Fields are required')
        req.flash('username', username)
        req.flash('email', email)
       return res.redirect(`/register/${role}`)
    }
   var right=false;
   if(!right)
   {
    if(!validator.isAlpha(req.body.username)){
        req.flash('error','Invalid Name, it should not contain a number or a symbol') 
       return  res.redirect(`/register/${role}`)

    } 
    if(!validator.isEmail(req.body.email)){
        req.flash('error','Invalid Email') 
        return  res.redirect(`/register/${role}`)
 
    }
    if(!validator.isStrongPassword(req.body.password)){
        req.flash('error','Password must be of 8 characters and it must contain a capital letter, a number and a special character') 
        return  res.redirect(`/register/${role}`)
    }
    right=true
   }
   
    let user = await UserModel.findOne({ email })
    if (user) {
        req.flash('error', 'Email already taken')
      
        res.render('register',{ title: 'Register', role:role})
    }
    else {
            const hashpw=await bcrypt.hash(req.body.password,10)
          
        let newUser = new UserModel({
            username: username,
            email: email,
            password: hashpw,
            role: role
        })
        newUser.save().then( async(user)=>{
                if(user)
            {
                if(role == 'renter'){
                    await UserModel.findOne({email:req.body.email},(err,doc)=>{
                        let newRenter=new Income({
                            r_id:doc._id,
                            Income:0
                        })
                        newRenter.save().then().catch((err) => console.log(err))
                    })
                    
                                    }
                                }
              res.redirect('/login')
        }).catch((err) => console.log(err))
    }
})

// Rider Routes
app.get('/rider-profile', islogin, isrider, async (req, res) => {
    let vehicles = await vehicleModel.find({ booked: false });
    res.render('rider/rider-profile', { title : 'Rider Profile', data: vehicles })
})  

app.post('/rider-profile/place-order', islogin, async (req, res) => {
    let my = req.body.vehicle;
    let data = JSON.parse(my)
    let owner = await UserModel.findOne({ _id: data.r_id })
    res.render('rider/place-order', { title: 'Place Order', data: data, owner: owner })

})
app.post('/rider-profile/confirm-order', (req, res) => {
    console.log(req.body)
    let my = req.body.vehicle;
    var vehicle = JSON.parse(my)
var TotalTime
var bill;
    if(req.body.start && req.body.end)
    {
        let date_1 = new Date(req.body.start);
        let date_2 = new Date(req.body.end);
        let difference = date_2.getTime() - date_1.getTime();
         TotalTime = Math.ceil(difference / (1000 * 3600 * 24));
            if(vehicle.Type==2){
                bill=TotalTime*200
            }
            else{

                bill=TotalTime*600;
            }
        if(TotalTime<=0)
        {
            return  res.render('./rider/err', {title: 'Err',err:'Drop Date Is Invalid'})
         }
         
}
let mobile=req.body.mobile
var phoneno = /^\d{10}$/
         if(!mobile.match(phoneno))
         {
            return  res.render('./rider/err', {title: 'Err',err:'Mobile Number Should Be 10 Digit '})

         }

    let location=req.body.location;

     res.render('rider/confirm-order',{title: 'Payment', data:vehicle,bill:bill,location:location,mobile:mobile,totalDays:TotalTime})

})
app.post('/rider-profile/confirm-payment',async(req,res)=>{
    let my = req.body.vehicle;
    var vehicle = JSON.parse(my)

    await vehicleModel.findByIdAndUpdate(vehicle._id, { booked: true }, (err, docs) => {
        if (docs) {
            vehicle.booked = true
            let newOrder = new Order({
                user_id: req.user._id,
                r_id:vehicle.r_id,
                booked_vehicle: vehicle,
                time: req.body.totalDays,
                bill: req.body.bill,
                mobile:req.body.mobile,
                location:req.body.location
            })
            newOrder.save().then(result =>{
                req.flash('success','order placed succsesfully')
                //use req.app.get('eventEmitter') if moving routs
              eventEmitter.emit ('orderPlaced',result);
            res.redirect('/rider-profile/all-orders')

            }).catch((err) => console.log(err))

        }
        else {
            res.send("some errore")
        }
    })

})

app.get('/rider-profile/all-orders', islogin, isrider,async (req, res) => {
    var vehicles = new Array();
    var owners = new Array();
    await Order.find({ user_id: req.user._id }, async (err, orders) => {
        if (orders) {
            for (i = 0; i < orders.length; i++) {
                vehicles[i] = orders[i].booked_vehicle
            }
        }
        for (let i = 0; i < vehicles.length; i++) {
            await UserModel.findOne({ _id: vehicles[i].r_id }, (err, doc) => {
                if (doc) {
                    owners[i] = doc.username
                }
                else {
                    console.log(err + "errrrr")
                }
            })

        }
        var data = new Array()
        data['h'] = orders;
        data['a'] = vehicles;
        data['b'] = owners;

        res.render('rider/all-orders', { title: 'All Orders', data: data,moment:moment })
    })
})

app.get('/rider-profile/all-orders/single-order/:id',async(req, res) => {
   let data=await Order.findById({_id:req.params.id})
   // Join 
     res.render('rider/single-order',{title: 'Order Details', data:data})
})


const server = app.listen(80, () => {
    console.log("Server is listening on port 80");
})
const io=require('socket.io')(server)
io.on('connection',(socket)=>{
    //join   
    socket.on ('join' , ( orderId ) => {
        socket.join (orderId)
        } )
        

})
eventEmitter.on('orderUpdated',(data)=>{
    io.to(`order_${data.id}`).emit('orderUpdated',data)
    })
 eventEmitter.on ('orderPlaced',(data) =>
 {

     io.to ('adminRoom').emit('orderPlaced',data)
    })
