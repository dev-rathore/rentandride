// import Noty from 'noty'//this is use to send notification
// const initAdmin=require('./admin');
//const moment=require('moment');//this will give the hh mm time format

let statuses=document.querySelectorAll('.status_line');
let hiddenInput=document.querySelector('#hiddenInput') ;
let order=hiddenInput? hiddenInput.value :null 
order=JSON.parse(order);
console.log(order)
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
// initAdmin(socket)

//join customer with his o  rder id
let socket=io()  
if(order)
{
    
    socket.emit('join',`order_${order._id}`)
}
socket.on('orderUpdated',(data)=>{
    order=data
    
    console.log(data)
    updateStatus(order);



    // const upadatedOrder={...order}//copying object by ...
    // upadatedOrder.updatedAT=moment().format()
    // upadatedOrder.status=data.status;
    // updateStatus(upadatedOrder)
    
console.log("data updated")

})
