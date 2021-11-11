const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('./connection');
var multer = require('multer');
const mongoose = require('mongoose');
const csvtojson = require("csvtojson");
var $ = require('jquery');
const { Mong } = require('mongodb');
const { query } = require('express');
const session = require('express-session');
const flash = require('express-flash');
const fastCsv = require('fast-csv');
const fs = require('fs');
const app = express();
let Ob = require('mongodb').ObjectID;
const { setTimeout } = require('timers');
const port = process.env.PORT || 3000;
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
    parameterLimit: 1000000,
  })
);
app.set('view engine', 'ejs');
app.use(express.static("public"));

// const ws = fs.createWriteStream("Download.csv");
var  last_searched_result;
var logged_in = false;
var admin = false;
var recent_file = "";
var data = "";
var storage = multer.diskStorage({
  destination: function (req, file, cb) {

    // Uploads is the Upload_folder_name
    cb(null, "uploads")
  },
  filename: function (req, file, cb) {
    recent_file = file.fieldname + "-" + Date.now() + ".csv"
    cb(null, file.fieldname + "-" + Date.now() + ".csv")
  }
})
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {

    // Set the filetypes, it is optional
    var filetypes = /csv/;
    var mimetype = filetypes.test(file.mimetype);



    if (mimetype) {
      return cb(null, true);
    }

    cb("Error: File upload only supports the "
      + "following filetypes - " + filetypes);
  }

  // mypic is the name of file attribute
}).single("csvfile");


app.get('/', (req, res) => {
  res.render('index.ejs', { data, inv: "Inv" });
});


app.post('/viewdb', (req, res) => {
  if (req.body.username == 'admin' && req.body.password == '0000') {
    logged_in = true;
    res.redirect('/viewdb');
  }
  else {

    res.redirect('/');
  }
})
app.get('/viewdb', async function (req, res) {
  if (logged_in || admin || (req.body.username == "admin" && req.body.password == "0000")) {
    var data_found="";
    var upd_query = {};
    var result;
    const client = mongo.main();
    await client.connect();
    if (req.query.location != null && req.query.location != "") {
      var local = { 'Country': req.query.location }
      console.log(local);
      var r = await client.db("MaxedsDB").collection("client").find(local).collation( { locale: 'en', strength: 2 } ).limit(1).toArray();
      if (r.length != 0) { console.log("IN loca"); upd_query['Country'] = req.query.location }
    }
    if (req.query.companyName != null && req.query.companyName != "") {
      var local = { "Company": req.query.companyName }
      var re = await client.db("MaxedsDB").collection("client").find(local).collation( { locale: 'en', strength: 2 } ).limit(1).toArray();
      if (re.length != 0) { console.log("IN loca"); upd_query['Company'] = req.query.companyName; }
    }
    if (req.query.name != null && req.query.name != "") {
      console.log("HI");
      var local = { "First Name": req.query.name }
      var resul = await client.db("MaxedsDB").collection("client").find(local).collation( { locale: 'en', strength: 2 } ).limit(1).toArray();
      console.log("btw");
      if (resul.length != 0) { console.log("name"); upd_query['First Name'] = req.query.name; }
    }
    if (req.query.title != null && req.query.title != "") {
      var local = { "Title": new RegExp(req.query.title) }
      var re = await client.db("MaxedsDB").collection("client").find(local).collation( { locale: 'en', strength: 2 } ).limit(1).toArray();
      if (re.length != 0) { console.log("IN title"); upd_query['Title'] = req.query.title; }
    }
    console.log(upd_query);
    result = await client.db("MaxedsDB").collection("client").find(upd_query).collation( { locale: 'en', strength: 2 } ).toArray();
    
    last_searched_result = result;
    if(Object.keys(upd_query).length === 0 && Object.keys(req.query).length !== 0)data_found="NO DATA FOUND";
    res.render('viewdb', { udata: result, Fn: "First Name", Ln: "Last Name", Cn: "Contact Phone", num: 0,data_found:data_found });
    client.close();


  }
})
async function downloadAsCsv(results){
  const ws = fs.createWriteStream("download.csv");
  fastCsv.write(results,{headers:true}).on("finish",function(){
    console.log("CSV Done!")
  }).pipe(ws);
}
app.post('/viewdb/download',async (req,res)=>{
  if((logged_in || admin) ){
     var client_download = mongo.main();
     await client_download.connect();
    //  console.log(req.body.dd);
    //  console.log(req.body.dd);
    let objectIdArray = req.body.dd.map(s => mongoose.Types.ObjectId(s));
    //  var que ={'_id':{ $in: req.body.dd }};
     var results = await client_download.db("MaxedsDB").collection("client").find({'_id':{$in:objectIdArray}}).toArray();
     console.log(results);
     client_download.close();
     await downloadAsCsv(results);
     setTimeout(()=>{res.download("download.csv");},1000) ;
  }
  
})
app.get('/adminlogin', (req, res) => {
  console.log("In admin login page");
  res.render('adminlogin.ejs');
})
app.post('/admin/main', async (req, res) => {
  console.log(req.method);
  logged_in = true; admin = true;
  res.render('adminmain');
})

app.get('/admin/upload', (req, res) => {
  if (logged_in && admin)
    res.render('upload');
  else res.redirect('/');
})
app.post('/admin/uploads', async function (req, res) {

  upload(req, res, async function (err, file) {
    if (err) {


      res.send(err);
    }
    else {

      csvtojson()
        .fromFile(`./uploads/${recent_file}`)
        .then(csvData => {
          console.log(csvData);
        })
      const client = mongo.main();
      await client.connect();
      var result = await client.db("client").insertMany(csvData, (err, res1) => {
        if (err) throw err;
        console.log(`Inserted: ${res1.insertedCount} rows`);
      });
      res.redirect('/viewdb');
      client.close();
    }
    recent_file = "";
  })

})











app.listen(port, () => console.log("port connected"));
