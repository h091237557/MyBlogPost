
var user = {
    login: function (stragtegy) {
        stragtegy();
    }
}


var loginStrategy = {
    fb : function(){
        doFbLoginSomething();
    },
    google : function(){
        doGoogleLoginSomething();
    },
    custom : function(){
        doSomething();
    }
}

user.login(loginStrategy.fb);


