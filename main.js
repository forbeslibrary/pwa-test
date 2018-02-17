var wp_server = "https://forbeslibrary.org/";
//var wp_server ="http://localhost:8080/wordpress/";

var app = {};

app.displayByPath = function (path) {
  // Note that this is not part of the standard WP REST API and requires a
  // plugin!
  $("#content").empty().append($('<p class="spinner"></p>'));

  $.ajax({
    url: wp_server + "wp-json/forbes/v1/path/" + path,
  }).then(function(data) {
    $("#content").empty();
    $("#content").append($('<h2>' + data.title.rendered + '</h2>'));
    $("#content").append(data.content.rendered);
    console.log(data);
  });
};

app.registerServiceWorker = function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(function() { console.log('Service Worker Registered'); });
  }
};

app.addLinkClickHandler = function () {
  var wp_content_re = /:\/\/forbeslibrary.org\/(.*?)\/?$/;
  $(document).on('click', 'a', function (e) {
    var href = $(this).attr('href');
    var matches = wp_content_re.exec(href);
    if (matches) {
      var path = matches[1];
      console.log(path);
      app.displayByPath(path);

      e.preventDefault();
    }
  });
};

app.addMenuClickHandler = function () {
  $('#main-navigation').on('click', 'a', function (e) {
    $('#navigation-toggle').prop('checked', false);
  });
};

$(document).ready(function() {
  app.registerServiceWorker();
  app.addLinkClickHandler();
  app.addMenuClickHandler();
  app.displayByPath('home');
});
