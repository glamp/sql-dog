var fs = require('fs')
  , path = require('path')
  , uuid = require('uuid')
  , _ = require('underscore');

require("shellshim").globalize();


add = function(filecontents, filename, username, done) {
  /*
   * Check and see if a gist repo exists already. If not, then we're going to 
   * create a new one and initialize a repo.
   */
  var gist_repo = path.join(__dirname, "gists");
  if (! fs.existsSync(gist_repo)) {
    fs.mkdirSync(gist_repo);
    $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
        "--work-tree", path.join(__dirname, "gists"),
        "init");
  }
  // we'll default filenames to uuids
  filename = filename || uuid.v1(); 
  filename = path.join(__dirname, "gists", filename + ".sql");
  fs.writeFileSync(filename, filecontents);
  /*
   * Add the new file to the git repo and commit it.
   */
  $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
      "--work-tree", path.join(__dirname, "gists"),
      "add", filename); 
  $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
      "--work-tree", path.join(__dirname, "gists"),
      "commit", "-m", "'le gist'");
  $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
      "--work-tree", path.join(__dirname, "gists"),
      "push");
  
  // %H for full SHA, %h for abbreviated SHA
  var sha = $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
      "--work-tree", path.join(__dirname, "gists"),
      "log", "-n", "1", "--no-merges", "--pretty=format:%H");
  done(sha);
}

remove = function(filename, done) {
  $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
      "--work-tree", path.join(__dirname, "gists"),
      "rm", filename); 
  $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
      "--work-tree", path.join(__dirname, "gists"),
      "commit", "-m", "'removed le gist'");
  $("git", "--git-dir", path.join(__dirname, "gists", ".git"),
      "--work-tree", path.join(__dirname, "gists"),
      "push");
  done();
};

list = function(done) {
  var files = fs.readdirSync(path.join(__dirname, "gists"));
  files = _.filter(files, function(f) {
    return f.slice(0, 1)!=".";
  });
  done(files);
}

open = function(filename, done) {
  var filepath = path.join(__dirname, "gists", filename);
  if (fs.existsSync(filepath)) {
    var file = fs.readFileSync(filepath);
    done(file.toString());
  } else {
    done(null);
  }
}


exports.add = add;
exports.remove = remove;
exports.list = list;
exports.open = open;
