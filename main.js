var wp_server = "https://forbeslibrary.org/";
//var wp_server ="http://localhost:8080/wordpress/";

var app = {};

app.displayNews = function () {
  $.ajax({
    url: wp_server + "wp-json/wp/v2/posts",
    data: {
      "categories": ["300"]
    }
  }).then(function(data) {
    $.each(data, function (index, value) {
      $("#news-placeholder").remove();
      $("#news").append("<p>" + value.title.rendered + "</p>");
    });
    console.log(data);
  });
};

app.displayByPath = function (path) {
  // Note that this is not part of the standard WP REST API and requires a
  // plugin!
  $.ajax({
    url: wp_server + "wp-json/forbes/v1/path/" + path,
  }).then(function(data) {
    $("#content").empty();
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

$(document).ready(function() {
  app.registerServiceWorker();
  app.addLinkClickHandler();
  app.displayNews();
});
