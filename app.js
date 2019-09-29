var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var arp = require('node-arp');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var session = require('express-session');
var mongoose  = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
mongoose.connect('localhost:27017/hack'); 
var Schema = mongoose.Schema;
app.use(session({secret:"max",saveUninitialized:false, resave:false}));

var student = new Schema({
name:String,
mac:{type:String,unique:true},
depart:String,
sec:String,
year:String
},{collection:'student'});

var stud = mongoose.model('studdb',student);

var studatt = new Schema({
name:String,
mac:{type:String,unique:true},
depart:String,
sec:String,
year:String,
attendance:Number,
pin:String
},{collection:'studatt'});

var studattdb = mongoose.model('studattdb',studatt);

var staff = new Schema({
name:String,
pass:String
},{collection:'staff'});

var staffdb = mongoose.model('staffdb',staff);


app.listen(8000);
console.log('8000');

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()){
    return next();
    console.log('ok');
  }

  res.redirect('/login');
}


var userData = require(__dirname+'/user');


app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());
require('./passport')(passport);


app.get('/',isLoggedIn,function(req,res){
  res.render('index',{title:'express'});
});

app.post('/getmac',function(req,res){
 console.log(req.body.mac);
 arp.getMAC(req.body.mac, function(err, mac) {
    if (!err) {
        console.log(mac);
    }
});

});



app.get('/login',function(req,res){
	res.render('login');
});


app.get('/stulogin',function(req,res){
	res.render('studentlogin');
});

app.get('/stusignup',function(req,res){
	res.render('studentsignup');
});

app.post('/login',function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (user === false) {
      // handle login error ...
      res.render('login',{ message: req.flash('loginMessage') });
    } else {
      req.login(user, function(err) {
        // handle successful login ...
      console.log(user);
      res.redirect('/');
      
      });
      
    }
  })(req, res, next);
});

app.get('/signup',function(req,res){
	res.render('signup');
});


app.post('/signup',function(req,res){
userData.findOne({username:req.body.email},function(err,data){
if(err) return err;
if(data){
  res.render('signup',{message:'username taken'})
}
else{
var item = {
 username:req.body.email,
 pass:req.body.password
};
userData(item).save();
staffdb({name:req.body.email,pass:null}).save();
res.redirect('/login')
}
});
});
var macid;
app.post('/stusignup',function(req,res){
	arp.getMAC(req.body.ip, function(err, mac) {
    if (!err) {
        console.log(typeof(mac));
    	macid = mac;
    }
});
console.log(macid);
var post = {name:req.body.name,mac:macid,year:req.body.year,sec:req.body.sec,depart:req.body.depart};
var postatt = {name:req.body.name,mac:macid,year:req.body.year,sec:req.body.sec,depart:req.body.depart,attendance:0};
if(macid!=undefined){
stud(post).save(function(err,result){
	if(err){
		res.send('account already exist');
	}
  studattdb(postatt).save();
  res.redirect('/stulogin');
});
}
else{
	res.redirect('/stusignup',{message:'retry'});
}
});

app.post('/stulogin',function(req,res){
	arp.getMAC(req.body.ip, function(err, mac) {
    if (!err) {
    	macid = mac;
    }
});
stud.findOne({'mac':macid},function(err,docs){
if(docs!=null){
	console.log('login successful');
  res.render('stuindex',{login:docs});
}
else{
	res.render('studentlogin',{message:'retry'});
}
});
});

app.get('/pin',isLoggedIn,function(req,res){
 var pinno = ("0"+(Math.floor(Math.random()*(0-9999+1))+0)).substr(-4);
 staffdb.findOne({name:req.user.username},function(err,doc){
  if(err){ throw err;}
  staffdb.findById(doc._id,function(err,docs){
    docs.pass = pinno;
    docs.save();
  });
 });
 res.render('pin',{pin:pinno});
});


app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

app.post('/studatt',function(req,res){
var macid = req.body.mac;
var pinno = req.body.pin;
staffdb.findOne({pass:pinno},function(err,docs){
if(docs!=null){
  studattdb.findOne({mac:macid},function(err,doc){
    studattdb.findById(doc._id,function(err,result){
      if(pinno!=result.pin){result.attendance+=1;
      result.pin=pinno;
      result.save();
      res.send('attendance casted');
      }
      else{
        res.send('attendance already casted');
      }
    });
    });
}
else{
  res.send('pin entered was wrong');
}
});
});

app.get('/average',isLoggedIn,function(req,res){
res.render('average');
});

app.post('/average',function(req,res){
var found=[];
studattdb.find({},function(err,docs){
//console.log(docs);
for(var i=0;i<docs.length;i++){
if(docs[i].depart==req.body.depart && docs[i].year==req.body.year && docs[i].sec == req.body.sec){
  var percentage = (parseInt(docs[i].attendance)/parseInt(req.body.periods) )*100;
  found.push({name:docs[i].name,depart:docs[i].depart,year:docs[i].year,sec:docs[i].sec,percentage:percentage});  
}
}
res.render('details',{array:found});
});
});
