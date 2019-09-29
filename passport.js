var LocalStrategy = require('passport-local').Strategy;


var userData  = require(__dirname+'/user');

module.exports = function(passport) {


	passport.serializeUser(function(user, done){
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done){
		userData.findById(id, function(err, user){
			done(err, user);
		});
	});

	passport.use('local-login', new LocalStrategy({
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		},
		function(req, email, password, done){
			process.nextTick(function(){
				console.log(email+password);
				userData.findOne({username:email}, function(err, user){
					if(err){
						return done(err);
					}
					if(!user){
						return done(null, false, req.flash('loginMessage', 'No User found'));
					}
					if(user.pass != password){
						console.log(user);
						console.log(user.pass + password);
						console.log(user.username + email);
						return done(null, false, req.flash('loginMessage', 'invalid password'));
					}
					return done(null, user);

				});
			});
		}
	));


};