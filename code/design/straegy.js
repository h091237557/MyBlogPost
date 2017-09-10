
var user = {
    login: function (stragtegy) {
        stragtegy();
    }
}


var loginStrategy = {
    fb: function () {
        doFbLoginSomething();
    },
    google: function () {
        doGoogleLoginSomething();
    },
    custom: function () {
        doSomething();
    }
}

user.login(loginStrategy.fb);


var user = {
    login: function (stragtegy) {
        if (type == "google") {
            doGoogleLoginSomething();
            console.log("google login process");
        } else if (type == "facebook") {
            doFbLoginSomething();
            console.log("facebook login process");
        } else {
            doSomething();
            console.log("custom login process");
        }

    }
}


