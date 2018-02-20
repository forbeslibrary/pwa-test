var homeURL = "https://forbeslibrary.github.io/pwa-test/";
var wp_server = "https://forbeslibrary.org/";
//var wp_server ="http://localhost:8080/wordpress/";

var app = {};

app.displayByPath = function (path, popstate=false) {
  // Note that this is not part of the standard WP REST API and requires a
  // plugin!
  $("#content").empty().append($('<p class="spinner"></p>'));
  if (!popstate) {
    history.pushState({"path": path}, path, homeURL + path);
  }

  if (path === '') {
    path = 'home';
  }

  $.ajax({
    url: wp_server + "wp-json/forbes/v1/path/" + path,
  }).then(function(data) {
    document.title = data.title.rendered + ' [Forbes Library]';
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
  $('#content').on('click', function (e) {
    $('#navigation-toggle').prop('checked', false);
  });
};

app.addPopStateHandler = function () {
  $(window).bind('popstate', function (e) {
    app.displayByPath(e.originalEvent.state.path, true);
  });
};

$(document).ready(function() {
  app.registerServiceWorker();
  app.addLinkClickHandler();
  app.addMenuClickHandler();
  app.addPopStateHandler();
  app.displayByPath(location.pathname.substring(1));
});
