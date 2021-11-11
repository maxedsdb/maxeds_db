const { MongoClient } = require('mongodb');
const assert = require('assert');
const { callbackify } = require('util');
const uri = "mongodb+srv://rohan:rohandb@cluster0.z0mxd.mongodb.net/MaxedsDB?retryWrites=true&w=majority";
var db;var client;
 const main=()=>{
    client = new MongoClient(uri,{useNewUrlParser: true });
    return client;
}

// const connectToserver=async(callback)=>{
//    try{
//      MongoClient.connect(uri,{ useNewUrlParser: true }, (err, client)=> {
//     assert.equal(null, err);
//    //  console.log("Connected successfully to server");
//     clients=client;
//     db = client.db("MaxedsDB");
//     return clients;
//     })
// }
// catch(err){
//    throw err;
// }
// }
//  function getDb() {
//    //  console.log("Got the db");
//      return db;
// }
// function closeConnection(){
//    //  console.log("connection closed");
//     clients.close();
// }
module.exports={main};