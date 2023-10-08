const express = require('express'); //importing express
const bodyParser = require('body-parser'); //importing body-parser
let cron = require('node-cron');
const db=require("./db");
var moment = require('moment');
const { json } = require('body-parser');
const jwt = require('jsonwebtoken');//jwt
const authenticateJWT=require("./tokenAuthenticationMiddleware.js");
const accessTokenSecret = 'sensegrass_neobanking'; 


const app=express();
const port=process.env.PORT||5000;
app.use(bodyParser.json({limit: '50mb'}));

app.get("/",(req,res)=> res.send("welcome to neobanking app"));
app.post("/getBasicDetails",authenticateJWT,(req,res)=>{
  let body=req.body;
  let emailId=body.email;
  let sql = `SELECT * FROM neoBankDb where email=?`;
    
  db.all(sql,[emailId], (err, rows) => {
      if (err) {
        res.send({"status":401,"message":err.message});
          throw err;
      }
    if(rows[0]!=null){
    res.send(rows[0]);
    }else{
      res.send({"status":402,"message":`no data in db`});
    }

  });
   
  
  
   
});

app.post("/transactionDeduct",authenticateJWT,(req,res)=>{
  let body=req.body;
  let emailId=body.email;
  let Latestamount=body.amount;
  let transactions=JSON.stringify(body.transactions);
  let pendingTransactions=JSON.stringify(body.pendingTransactions);

    
  db.run("UPDATE neoBankDb SET wallet=?,transactionObject=?,pendingTransactionObject=? where email=?",[Latestamount,transactions,pendingTransactions,emailId], function(err) {
    if (err) {
     res.send({"status":401,"message":err.message});
      return console.log(err.message);
    }
    // get the last insert id
    console.log(`A row has been updated with rowid ${emailId}`);
    console.log(transactions);
    res.send({"status":200,"message":`transaction successfull remaing wallet amount is ${Latestamount}`});
  });
   
  
  
   
});
app.post("/login",(req,res)=>{
  let body=req.body;
  let emailId=body.email;
  let pwd=body.password;
  let sql = `SELECT * FROM auth where email=?`;
  db.all(sql,[emailId], (err, rows) => {
    if (err) {
      res.send({"status":401,"message":err.message});
        throw err;
    }

  if(rows[0]!=null){
   if(rows[0].email==emailId && rows[0].pwd==pwd){
    const accessToken = jwt.sign({emailId,pwd}, accessTokenSecret);
  
    res.send({"status":200,"message":`login successfull`,"accessToken":accessToken});
   }else{
    res.send({"status":401,"message":`Please enter correct credentials`});
   }
  }else{
    res.send({"status":402,"message":`no user with this email ${emailId} found, try entering other credentials`});
  }

  });
  
    
 
  
  
   
});

app.listen(port,()=>console.log('running on port http://localhost:'+port));







  