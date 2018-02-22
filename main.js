/**
 * @fileoverview main.js contains the client side javascript to be run directly
 * by the webpage. Its primary responsibility is routing and event handling.
 */

var homeURL = "/pwa-test/";
var wp_server = "https://forbeslibrary.org/";

var app = {};

app.init = function () {
  app.registerServiceWorker();
  app.addLinkClickHandler();
  app.addMenuClickHandler();
  app.addPopStateHandler();

  var params = (new URL(document.location)).searchParams;

  if (params.has('s')) {
    app.displaySearchResults(params.get('s'));
  } else {
    app.displayByPath(location.pathname.substring(homeURL.length));
  }
};

app.displayByPath = function (path, popstate=false) {
  $("#content").empty().append($(`<p class="spinner"> loading: ${path}</p>`));

  if (!popstate) {
    history.pushState({"path": path}, path, homeURL + path);
  }

  if (path === '') {
    path = 'home';
  }

  // Note that this is not part of the standard WP REST API and requires a
  // plugin!
  $.ajax({
    url: wp_server + "wp-json/forbes/v1/path/" + path,
  }).then(function(data) {
    document.title = `${data.title.rendered} [Forbes Library]`;
    $("#content").empty();
    $("#content").append($(`<h2>${data.title.rendered}</h2>`));
    $("#content").append(data.content.rendered);
    console.log(data);
  });
};

app.displaySearchResults = function (query) {
  $("#content").empty().append($('<p class="spinner"> loading search results</p>'));

  history.pushState({"path": '/', "search": query}, "Search Results", `${homeURL}?s=${query}`);
  document.title = 'Search Results [Forbes Library]';

  // Note that this is not part of the standard WP REST API and requires a
  // plugin!
  $.ajax({
    url: wp_server + "/wp-json/relevanssi/v1/search?s=" + query,
  }).then(function(data) {
    $("#content").empty();
    $("#content").append($('<h2>Search Results</h2>'));
    data.forEach( function (post) {
      var article = $('<article>');
      $(article).append(`<h3><a href="${post.link}">${post.title.rendered}</a></h3>`);
      $(article).append(`<cite>${post.link}</cite>`);
      $(article).append(`<div>${post.excerpt.rendered}</div>`);
      $("#content").append(article);
      console.log(post);
    });


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

// Initalize the app once the DOM has loaded and is ready for javascript.
$(document).ready(function() {
  app.init();
});
