var express = require('express')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , _ = require('underscore')
  , gists = require('./gists');

if (fs.existsSync(path.join(__dirname, "..", ".settings"))) {
  var DB_CONN = fs.readFileSync(path.join(__dirname, "..", ".settings"));
  DB_CONN = JSON.parse(DB_CONN);
  var connstring = "";
  connstring += DB_CONN.sqltype.toLowerCase() + "://";
  connstring += DB_CONN.username + "@" + DB_CONN.password + "/";
  connstring += DB_CONN.hostname + "/" + DB_CONN.dbname;
  DB_CONN = connstring;
}

var sql = require('./sql-client')(process.env["DB_CONN"] || "postgres://glamp@localhost/sandbox");

var schema = null;
sql.loadMetadata(function(err, meta) {
  if (err) {
    console.log("could not load metadata: ", err);
  }
  schema = []
  _.pairs(meta).forEach(function(pair) {
    pair[1].forEach(function(row) {
      row.table = pair[0];
      schema.push(row);
    });
  });
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '../../views');
app.set("view engine", "html");
app.engine("html", require('hogan-express'));

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, '../public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


app.get("/", function(req, res) {
  var userfiles = [];
  gists.list(function(files) {
    files.forEach(function(filename) {
      gists.open(filename, function(filecontent) {
        var f = { filename: filename, filecontent: filecontent };
        f.escapedFilename = f.filename.replace(".", "-");
        userfiles.push(f);
      });
    });
    res.render("home", { title: "SQL Dog", schema: schema, files: userfiles });
  });
});

app.get("/about", function(req, res) {
  res.render("about", { title: "SQL Dog" });
});

app.post("/settings", function(req, res) {
  var settingsfile = path.join(__dirname, "..", ".settings");
  fs.writeFileSync(settingsfile, JSON.stringify(req.body, null, 2));
  res.send({ status: "done" });
});

app.post("/query", function(req, res) {
  sql.execute(req.body.query, 10000, function(err, results) {
    res.send({ results: results });
  });
});

app.get("/file/:name", function(req, res) {
  gists.open(req.params.name, function(filecontent) {
    res.send({ filecontent: filecontent });
  });
});

app.post("/bulk", function(req, res) {
  var query = req.body.query
    , filename = sha(query)
    , path_to_file = path.join(__dirname, "bulk", filename);

  sql.execute(query, -1, function(err, result) {
    res.send({ result: result});
    //res.download(path_to_file);
  });
});


var io = require('socket.io').listen(server, { log: false });

io.sockets.on("connection", function(socket) {
  // create a cache for queries and results
  socket.cache = { query: {}, results: {} };

  sql.loadMetadata(function(err, meta) {
    if (err) {
      console.log("could not load metadata: ", err);
    }
    console.log("metadata loaded");
  });
  
  /*
   * expecting something like this:
   * { table: "" } || { table: "fo"} || { table: "foo", text: "col" }
   */
  socket.on("type-ahead", function(data) {
    sql.typeAhead(data.table, data.text, data.tokens, function(err, results) {
      if (err) {
        socket.emit("type-ahead", []);
        return;
      }
      socket.emit("type-ahead", results);
    });
  });

  socket.on("query", function(data) {
    socket.emit("query-status", { status: "running" });
    // re-route bulk query to somewhere else?
    if (data.type=="bulk") {
    } else {
      // check cache (?)
      if (_.has(socket.cache.results, data.query)) {
        socket.emit("query-result", socket.cache.results[data.query]);
      } else {
        // we're going to execute the query and send it back over the wire
        // TODO: we're going to need a way to kill queries...
        sql.execute(data.query, 10000, function(err, result) {
          if (err) {
            console.log("error executing query: ", err);
            socket.emit("query-error", err);
            socket.emit("query-status", { status: "stopped" });
            return;
          }
          // TODO: we should stream this...
          socket.emit("query-result", result);
          socket.emit("query-status", { status: "stopped" });
          console.log(queries);
        });
      }
    }
  });

  socket.on("cancel-query", function(data) {
    sql.kill(data.query, function(err, status) {
      if (err) {
      }
      console.log(status);
    });
  });

  socket.on("list", function(data) {
    gists.list(function(files) {
      socket.emit("files", files);
    });
  });

  socket.on("open-file", function(data) {
    gists.open(data.filename, function(filecontent) {
      socket.emit("open-file", { filecontent: filecontent } );
    });
  });

  socket.on("search-files", function(data) {
    gists.search(data.query, function(err, results) {
      if (err) {
        console.log(error);
        return;
      }
      socket.emit("search-results", results);
    });
  });
  
  socket.on("save", function(data) {
   // handle saving a query or query results
   if (data.type=="query") {
     // stuff into key/value store
     socket.cache.query[data.query] = data.query;
     var username = null; //req.user.username;
     gists.add(data.query, data.filename, username, function(sha) {
       console.log("added new query: " + sha);
     });
   } else if (data.type=="results") {
     // stuff into key/value store (could move this to SQLite)
     socket.cache.results[data.query] = data.results;
   }
  });

  socket.on("remove", function(data) {
    gists.remove(data.filename, function() {
      console.log(data.filename + " was removed.");
    });

  });

});
