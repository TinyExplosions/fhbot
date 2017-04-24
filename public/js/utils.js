$(function() {
    var $userPassword = $('#userPassword'),
        $userName = $('#userName'),
        $studiourl = $('#studiourl'),
        $client = $('#client'),
        $submitbtn = $('button[type="submit"]'),
        submitbtnTxt = $submitbtn.text(),
        $serverResponse = $('#responseBox'),
        $spinner = $('#loadingSpinner').text();

    formSubmit = function(evt) {
        evt.preventDefault();
        var userPassword = $userPassword.val(),
            userName = $userName.val(),
            studiourl = $studiourl.val();
        $submitbtn.attr('disabled', true).text('Authenticating...');

        tryLogin(userName, userPassword, studiourl);
    };

    tryLogin = function(userName, userPassword, studiourl) {
        //  /cloud/auth
        $serverResponse.html($spinner);
        $.ajax({
            url: "/auth/login",
            type: "POST",
            data: {
                userName: userName,
                userPassword: userPassword,
                studiourl: studiourl,
                client: $client.val()
            }
        }).always(function(data, textStatus, error) {
            $submitbtn.attr('disabled', false).text(submitbtnTxt);
            var response;
            if(data.status === 500) {
              response = "There was a problem logging in. Check your studio URL and try again."
            } else if (textStatus === "success") {
                $userPassword.val("");
                response = "You've successfully authenticated to the studio. Return to Slack and type '/fhbot'";
                status = 200;
            } else {
                response = data.responseJSON;
            }
            $serverResponse.hide().html('<p>' + JSON.stringify(response, null, 2) + '</p>').fadeIn();
        });
    };

    $('a.toggleGroups').on('click', function() {
        $('.groups').attr('hidden', $('.groups').is(':visible'));
    });

    $('form').on('submit', formSubmit);
});