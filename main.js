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

app.registerServiceWorker = function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(function() { console.log('Service Worker Registered'); });
  }
};

$(document).ready(function() {
  app.registerServiceWorker();
  app.displayNews();
});
