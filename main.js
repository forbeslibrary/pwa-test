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

app.displayBySlug = function (slug) {
  $.ajax({
    url: wp_server + "wp-json/wp/v2/pages",
    data: {
      "slug": slug
    }
  }).then(function(data) {
    var page = data[0];
    $("#content").empty();
    $("#content").append(page.content.rendered);
    console.log(page);
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
  $('a').click(function (e) {
    var href = $(this).attr('href');
    var matches = wp_content_re.exec(href);
    if (matches) {
      var slug = matches[1];
      console.log(slug);
      app.displayBySlug(slug);

      e.preventDefault();
    }
  });
};

$(document).ready(function() {
  app.registerServiceWorker();
  app.addLinkClickHandler();
  app.displayNews();
});
