
var mongoose  = require('mongoose');
var Schema = mongoose.Schema;
var user = new Schema({
    username:{type:String,required:true},
    pass:String
},{collection:'hack'});

module.exports = mongoose.model('userData',user);