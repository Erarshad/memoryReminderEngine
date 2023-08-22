const express = require('express'); //importing express
const bodyParser = require('body-parser'); //importing body-parser
let cron = require('node-cron');
const db=require("./db");
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var moment = require('moment');


const app=express();
const port=process.env.PORT||5000;
app.use(bodyParser.json({limit: '50mb'}));

app.get("/",(req,res)=> res.send("welcome to memory app"));
app.get("/getMemories",(req,res)=>{
  let sql = `SELECT * FROM memories`;
    
  db.all(sql, (err, rows) => {
      if (err) {
        res.send({"status":401,"message":err.message});
          throw err;
      }
 
   res.send(rows);

 
   
  });
   
  
  
   
});

app.post("/createMemory",(req,res)=>{
    let body=req.body;
    /**
     *  {   "id":200,
    "email":"postman@mail.com",
    "title":"post",
    "description":"it is from postman",
    "eventdate":"24/05/2002 18:30",
     "tags":"hi",
     "image64":"",
     "lastSentDate":"20/09/2022",
     "dateAdded":"20/09/2022"
}
     */
    let id=body.id;
    let email=body.email;
    let title=body.title;
    let description=body.description;
    let eventdate=body.eventdate;
    let tags=body.tags;
    let image64=body.image64;
    let lastSentDate=body.lastSentDate;
    let dateAdded=body.dateAdded;
    console.log(body);
    insertIntoDb(email,title,description,eventdate,lastSentDate,dateAdded,tags,image64,id,res,()=>{
         //send mail on priority iF LAST sent is null
      sendEmail(title,description,email,image64);
      //update the last sent date
      updateLastSentDate(moment().format('DD/MM/YYYY'),id); //
    });

 
   

});


app.post("/updateMemory",(req,res)=>{
    let body=req.body;
    /**
     *  {   "id":200,
    "email":"postman@mail.com",
    "title":"post",
    "description":"it is from postman",
    "eventdate":"24/05/2002 18:30",
     "tags":"hi",
     "image64":"",
     "lastSentDate":"20/09/2022",
     "dateAdded":"20/09/2022"
}
     */
    let id=body.id;
    let email=body.email;
    let title=body.title;
    let description=body.description;
    let eventdate=body.eventdate;
    let tags=body.tags;
    let image64=body.image64;
    let lastSentDate=body.lastSentDate;
    let dateAdded=body.dateAdded;
    updateIntoDb(email,title,description,eventdate,lastSentDate,dateAdded,tags,image64,id,res);
  

});


 


app.listen(port,()=>console.log('running on port http://localhost:'+port));


function insertIntoDb(email,title,description,eventdate,lastSentDate,dateAdded,tags,image64,id,res,fn){
    db.run("INSERT INTO memories (email,title,description,eventdate,lastSentDate,dateAdded,tags,image64,id) VALUES (?,?,?,?,?,?,?,?,?)",[email,title,description,eventdate,lastSentDate,dateAdded,tags,image64,id], function(err) {
        if (err) {
          res.send({"status":401,"message":err.message});
          return console.log(err.message);
          
        }
        // get the last insert id
        fn();
        console.log(`A row has been inserted with rowid ${id}`);
        res.send({"status":200,"message":"Memory added successfully"});
      });
    
 
}


function updateIntoDb(email,title,description,eventdate,lastSentDate,dateAdded,tags,image64,id,res){
    db.run("UPDATE memories SET email=?,title=?,description=?,eventdate=?,lastSentDate=?,dateAdded=?,tags=?,image64=? where id=?",[email,title,description,eventdate,lastSentDate,dateAdded,tags,image64,id], function(err) {
        if (err) {
         res.send({"status":401,"message":err.message});
          return console.log(err.message);
        }
        // get the last insert id
        console.log(`A row has been updated with rowid ${id}`);
        res.send({"status":200,"message":"Memory updated successfully"});
      });
    
 
}


cron.schedule('0 0 0 * * *', () => {
    // console.log('will run every day at 12:00 AM');
    fetchDataToSent();


});




function fetchDataToSent(){
    let sql = `SELECT * FROM memories ORDER BY lastSentDate ASC`;
    
    db.all(sql, (err, rows) => {
        if (err) {
            throw err;
        }
   
    console.log(rows[0]);
    let  tuple=rows[0];
     sendEmail(tuple.title,tuple.description,tuple.email,tuple.base64Data);
     //after sending update the last sent date
     updateLastSentDate(moment().format('DD/MM/YYYY'),tuple.id);

   
     
    });


   
}

function updateLastSentDate(updatedLastSentDate,id){
  db.run("UPDATE memories SET lastSentDate=? where id=?",[updatedLastSentDate,id], function(err) {
    if (err) {
     
      return console.log(err.message);
    }
    // get the last insert id
    console.log(`A cell has been updated with rowid ${id}`);
  
  });


}

function sendEmail(sub,description,to,base64Data){

   

    var transporter = nodemailer.createTransport(smtpTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
          user: 'mo303543@gmail.com',
          pass: 'rjxwldrncgbbhcuc'
        }
      }));
      console.log(base64Data);
      var mailOptions = base64Data.length>0?
      {
        from: 'mo303543@gmail.com',
        to: to,
        subject: sub,
       // html:"<p>"+description+"</p>"+"<br>"+ base64Data!=null?"<img src=\"data:image/png;base64,"+base64Data+"\"/>":""
         text:description,
         
         attachments:[{
          path:'data:image/png;base64,'+base64Data
          }
         ]

      }:{
        from: 'mo303543@gmail.com',
        to: to,
        subject: sub,
       // html:"<p>"+description+"</p>"+"<br>"+ base64Data!=null?"<img src=\"data:image/png;base64,"+base64Data+"\"/>":""
         text:description,
         

      }
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      }); 

}


  