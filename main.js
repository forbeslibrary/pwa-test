/**
 * @fileoverview main.js contains the client side javascript to be run directly
 * by the webpage. Its primary responsibility is routing and event handling.
 */

/* jshint esversion:6 */

var homeURL = "/pwa-test/";
var wp_server = "https://forbeslibrary.org/";

var app = {};


/**
 * Initializes the app. This is called after the DOM is loaded.
 */
app.init = function () {
  app.registerServiceWorker();
  app.addLinkClickHandler();
  app.addMenuClickHandler();
  app.addPopStateHandler();
  app.enhanceSearchForm();
  app.enhanceSidebar();

  var acknowledged = window.confirm('This website is a test and a demo and is incomplete. The official Forbes Library website can be found at https://forbeslibrary.org/. Click OK to proceed or CANCEL to be redirect to the offial site.');
  if (!acknowledged) {
    window.location.href = 'https://forbeslibrary.org/';
  }
  app.route(document.location);
};

/**
 * Loads the appropriate content based on the passed url.
 */
app.route = function (url, popstate=false) {
  url = new URL(url);
  console.log('route to: ' + url.href);

  if (!popstate) {
    history.pushState({}, url.href, url.href);
    $(document).scrollTop(0);
  }

  if (url.searchParams.has('s')) {
    url.pathname = homeURL;
    history.replaceState({}, url.href, url.href);
    app.displaySearchResults(url.searchParams.get('s'));
  } else {
    var path = url.pathname.substring(homeURL.length);
    if (path == '') {
      app.displayStaticFile('static/home.html');
    } else {
      app.displayByPath(path);
    }
  }
};

/**
 * Display static file. This pulls content directly from the webserver and does
 * not use the WordPress REST API.
 */
app.displayStaticFile = function (path) {

  $.ajax({
    url: homeURL + path
  }).then(function (data) {
    $("#content").empty();
    $("#content").append(data);
  }).catch(function (reason) {
    $("#content").empty();
    $("#content").append(`Failed to fetch the requested data: ${reason.statusText}`);
  });
};

/**
 * Displays the content associated with a path on wordpress.
 *
 * Note that this uses an AJAX call that is not part of the standard WP REST API
 * and requires a plugin!
 *
 * Also note that does not respect redirects.
 */
app.displayByPath = function (path) {
  $("#content").empty().append($(`<p class="spinner"> loading: ${path}</p>`));

  let requestURL = wp_server + "wp-json/forbes/v1/path/" + path;
  let cacheSuccess = false;
  let networkSuccess = false;

  function updatePage (data) {
    document.title = `${data.title.rendered} [Forbes Library]`;
    $("#content").empty();
    $("#content").append($(`<h2>${data.title.rendered}</h2>`));
    $("#content").append(data.content.rendered);
    console.log(data);
  }

  // fetch cached data, if it exists
  let cacheUpdate = caches.match(requestURL).then(function (data) {
    if (data) {
      cacheSuccess = true;
    }
    if (data && !networkSuccess) {
      updatePage(data);
    }
  });

  let networkUpdate = $.ajax({
    url: requestURL
  }).then(function (data) {
    networkSuccess = true;
    if (!cacheSuccess) {
      updatePage(data);
    }
  });

  Promise.all([cacheUpdate, networkUpdate]).catch(function (reason) {
    $("#content").empty();
    $("#content").append(`Failed to fetch the requested data: ${reason.statusText}`);
  });
};

/**
 * Displays search results for the query.
 *
 * Note that this uses an AJAX call that is not part of the standard WP REST API
 * and requires a plugin!
 */
app.displaySearchResults = function (query) {
  $("#content").empty().append($('<p class="spinner"> loading search results</p>'));
  document.title = 'Search Results [Forbes Library]';

  $.ajax({
    url: wp_server + "/wp-json/relevanssi/v1/search?s=" + query,
  }).always(function (data) {
    $("#content").empty();
    $("#content").append('<h2>Search Results</h2>');
  }).done(function (data) {
    data.forEach(function (post) {
      let type = '';
      let typeClass = '';
      switch (post.type) {
        case 'lib_databases':
          type = "Online Resource";
          typeClass = 'fa fa-fw fa-search';
          break;
        case 'staff_picks':
          type = "Staff Pick";
          typeClass = 'fa fa-fw fa-star';
          break;
      }
      var article = $('<article class="search-result">');
      $(article).append(`<h3><a href="${post.link}">${post.title.rendered}</a></h3>`);
      if (type) {
        $(article).append(`<div class="result-type"><i class="${typeClass}"></i>${type}</div>`);
      }
      $(article).append(`<cite><a href="${post.link}">${post.link}</a></cite>`);
      $(article).append(`<div>${post.excerpt.rendered}</div>`);
      $("#content").append(article);
      console.log(post);
    });
    $("#content a").first().focus();
  }).catch(function (reason) {
    $("#content").append(`<p class="no-results">${reason.responseJSON.message}</p>`);
  });
};

/**
 * Registers the ServiceWorker in browsers that support it.
 */
app.registerServiceWorker = function () {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(function() { console.log('Service Worker Registered'); });
  }
};


/**
 * Adds a click handler that loads prevents the default action on links to
 * content from forbeslibrary.org and loads the content through ajax instead.
 */
app.addLinkClickHandler = function () {
  $(document).on('click', 'a', function (e) {
    var url = new URL($(this).attr('href'));
    if (url.hostname == 'forbeslibrary.org') {
      url.hostname = document.location.hostname;
      if (document.location.port) {
        url.port = document.location.port;
      }
      url.protocol = document.location.protocol;
      url.pathname = homeURL + url.pathname.substring(1);
      app.route(url);

      e.preventDefault();
    }
  });
};

/**
 * Improves the search form with, primarily by allowing ajax requests.
 */
app.enhanceSearchForm = function () {
  $('#search-form').on('submit', function (e) {
    var query = $('#search-box').val();
    app.route(`${app.baseURL()}?s=${query}`);
    e.preventDefault();
  });
  $('#search-form').on('focus', function (e) {
    $('#search-box').focus();
    e.preventDefault();
  });
};

/**
 * Improves the sidebar by making it "sticky"
 */
app.enhanceSidebar = function () {
  let lastPosition = $(window).scrollTop();
  let sidebar = $('#main-navigation');
  let sidebarInitalTop = sidebar.offset().top;

  $(window).on('scroll', adjustSidebar);
  $(window).on('resize', adjustSidebar);

  function adjustSidebar(e) {
    let currentPosition = $(window).scrollTop();
    let delta = currentPosition - lastPosition;
    lastPosition = currentPosition;

    let sidebarBoundingClientRect = sidebar.get(0).getBoundingClientRect();
    let windowHeight = $(window).height();
    let sidebarTop = sidebar.offset().top;

    if (delta >= 0) {
      // scrolling down or resizing
      if (sidebar.height() < windowHeight - sidebarInitalTop) {
        sidebar.css({position: 'fixed', top: sidebarInitalTop, bottom: 'initial'});
      } else if (sidebarBoundingClientRect.bottom <= windowHeight) {
        sidebar.css({position: 'fixed', bottom: '0', top: 'initial'});
      } else if (sidebar.css('position') == 'fixed') {
        sidebar.css({position: 'absolute', top: sidebarTop, bottom: 'unset'});
      }
    }
    if (delta < 0) {
      // scrolling up
      if (sidebarBoundingClientRect.top >= sidebarInitalTop) {
        sidebar.css({position: 'fixed', top: sidebarInitalTop, bottom: 'initial'});
      } else if (sidebar.css('position') == 'fixed') {
        sidebar.css({position: 'absolute', top: sidebarTop, bottom: 'unset'});
      }
    }
  }
};

/**
 * Gets the base url for the app
 */
app.baseURL = function () {
  var url = new URL(document.location);
  url.pathname = homeURL;
  url.search = '';
  url.hash = '';
  return url;
};

/**
 * Adds click handlers that enhance the menu by closing it if neccesary after
 * and closing it as necessary if the user clicks outside of the menu area.
 */
app.addMenuClickHandler = function () {
  $('#main-navigation').on('click', 'a', function (e) {
    $('#navigation-toggle').prop('checked', false);
  });
  $('#content').on('click', function (e) {
    $('#navigation-toggle').prop('checked', false);
  });
};


/**
 * Adds a popstate handler that routes requests on a popstate event, i.e. When
 * navigating using the browser history.
 */
app.addPopStateHandler = function () {
  $(window).bind('popstate', function (e) {
    app.route(document.location, true);
  });
};

// Initalize the app once the DOM has loaded and is ready for javascript.
$(document).ready(function() {
  app.init();
});
