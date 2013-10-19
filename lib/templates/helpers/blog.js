var url = require('url');

function profileUrl(authorUrl) {
  var authorUrl = url.parse(authorUrl, true);

  authorUrl.query.rel = 'author';

  return authorUrl.format();
}

function blogArchive (posts, options) {
  var ret = '';
  var postsLength = posts.length;
  var p, post;
  var currentYear = '';

  for (p = 0; p < postsLength; p++) {
    post = posts[p];

    if (p > 0 && currentYear !== post.published_year) {
      ret += '</ul></section>';
    }

    if (currentYear !== post.published_year) {
      ret += '<section class="card archive_year"><h1 class="card_title archive_year_title">' + post.published_year + '</h1><ul>';
      currentYear = post.published_year;
    }

    ret += '<li>' + options.fn(post) + '</li>';

    if (p === postsLength - 1) {
      ret += '</ul></section>';
    }
  }

  return ret;
}

function enhanceHashtags(content, tags) {
  var t;
  var tagName;
  var regexp;

  if (Array.isArray(tags)) {
    for (t = 0; t < tags.length; t++) {
      tagName = tags[t].pretty_name ? tags[t].pretty_name : tags[t].name;
      regexp = new RegExp('\\S*#' + tags[t].name + '\\w*', 'gi');
      content = content.replace(regexp, '[' + tagName + '](/tags/' + tags[t].name + ')');
    }
  }

  return content;
}

function init(handlebars) {
  function paginate (data, options) {
    if (+data.pages === 1) {
      return '';
    }

    var ret = '';
    var p;

    ret += '<nav class="pagination">';
    ret += '<ul>';

    if (+data.page === 1) {
      ret += '<li><span role="button" aria-disabled="true">Previous</span></li>';
    }
    else if (+data.page === 2) {
      ret += '<li><a href="' + data.url + '" role="button">Previous</a></li>';
    }
    else {
      ret += '<li><a href="' + data.url + '/' + (data.page - 1) + '" role="button">Previous</a></li>';
    }

    ret += '<li>Page ' + data.page + ' of ' + data.pages + '</li>';

    if (+data.page === +data.pages) {
      ret += '<li><span role="button" aria-disabled="true">Next</span></li>';
    }
    else {
      ret += '<li><a href="' + data.url + '/' + (data.page + 1) + '" role="button">Next</a></li>';
    }

    ret += '</ul>';
    ret += '</nav>';

    return new handlebars.SafeString(ret);
  }

  function paginateForm (data, inputs, options) {
    if (+data.pages === 1) {
      return '';
    }

    var ret = '';
    var p;

    ret += '<nav class="pagination">';
    ret += '<form method="post">';

    if (inputs && Object.keys(inputs).length) {
      for (var k in inputs) {
        if (inputs.hasOwnProperty(k) && k !== 'page') {
          ret += '<input type="hidden" name="' + k + '" value="' + inputs[k] + '">';
        }
      }
    }

    ret += '<ul>';

    ret += '<li>';
    if (+data.page === 1) {
      ret += '<button type="submit" name="page"  disabled>Previous</button>';
    }
    else if (+data.page === 2) {
      ret += '<button type="submit">Previous</button>';
    }
    else {
      ret += '<button type="submit" name="page" value="' + (data.page - 1) + '">Previous</button>';
    }
    ret += '</li>';

    ret += '<li>Page ' + data.page + ' of ' + data.pages + '</li>';

    ret += '<li>';
    if (+data.page === +data.pages) {
      ret += '<button type="submit" disabled>Next</button>';
    }
    else {
      ret += '<button type="submit" name="page" value="' + (data.page + 1) + '">Next</button>';
    }
    ret += '</li>';

    ret += '</ul>';
    ret += '</form>'
    ret += '</nav>';

    return new handlebars.SafeString(ret);
  }

  handlebars.registerHelper('blog_archive', blogArchive);
  handlebars.registerHelper('enhance_hashtags', enhanceHashtags);
  handlebars.registerHelper('paginate', paginate);
  handlebars.registerHelper('paginate_form', paginateForm);
  handlebars.registerHelper('profile_url', profileUrl);
}

module.exports = init;

