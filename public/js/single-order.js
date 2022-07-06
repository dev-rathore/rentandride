
//import Noty from 'noty'//this is use to send notification
// const initAdmin=require('./admin');
//const moment=require('moment');//this will give the hh mm time format

let statuses=document.querySelectorAll('.status_line');
let hiddenInput=document.querySelector('#hiddenInput') ;
let order=hiddenInput? hiddenInput.value :null 
order=JSON.parse(order);
let time=document.createElement('small');

function updateStatus(order){
    statuses.forEach((status)=>{
        status.classList.remove('step-completed')
        status.classList.remove('current')
    })
    let stepCompleted=true;

statuses.forEach((status) => {
    let dataProp=status.dataset.status;
    if(order.status === 'Pending'){
        stepCompleted = false;
        const firstStatus = document.getElementsByClassName('status_line')[0];
        firstStatus.classList.add('current');
    }
    if(stepCompleted)
    {
        status.classList.add('step-completed')
    }
    if(dataProp === order.status)
    {
        stepCompleted=false;
        // time.innerText=moment(order.updatedAt).format('hh:mm');
        // status.appendChild(time);
        if(status.nextElementSibling){

            status.nextElementSibling.classList.add('current') //will return next element
        }
    }
    console.log(status);
});
}
updateStatus(order);
//socket client side 
//we have imported socekt .io in our layout file to access it on front end
let socket=io()  
// initAdmin(socket)

//join customer with his o  rder id
if(order)
{

    socket.emit('join',`order_${order._id}`)
}

let adminAreaPath=window.location.pathname
console.log(adminAreaPath)
if(adminAreaPath.includes('admin')){
    console.log("in admin path");
    socket.emit('join','adminRoom')//creating eveent join for admin
}
socket.on('orderUpdated',(data)=>{

    // const upadatedOrder={...order}//copying object by ...
    // upadatedOrder.updatedAT=moment().format()
    // upadatedOrder.status=data.status;
    // updateStatus(upadatedOrder)
    // new Noty({
    //     type: 'success',
    //     timeout: 1000,
    //     text: 'Order Updated',
    //     progressBar: false,
    // }).show();
})
