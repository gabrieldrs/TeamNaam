/**
 * GET /
 * Home page.
 */

exports.two = function(req, res) {
  res.render('pages/explorer2', {
    title: 'Home'
  });
};


exports.emails = function(req, res) {
  res.render('pages/emails', {
    title: 'Home'
  });
};

exports.directory = function(req, res) {
  res.render('pages/directory', {
    title: 'Home'
  });
};

exports.explorer = function(req, res) {
  res.render('pages/explorer', {
    title: 'Home'
  });
};

exports.seniorMatching = function(req, res) {
  res.render('pages/seniorMatching', {
    title: 'Home'
  });
};

exports.matching = function(req, res) {
  res.render('pages/seniorMatching', {
    title: 'Home'
  });
};

exports.juniorMatching = function(req, res) {
  res.render('pages/juniorMatching', {
    title: 'Home'
  });
};


exports.staging = function(req, res) {
  res.render('pages/staging', {
    title: 'Home'
  });
};

exports.cohorts = function(req, res) {
  res.render('pages/cohorts', {
    title: 'Home'
  });
};
