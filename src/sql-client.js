var pg = require('pg')
  , sqlqueries = require('./queries')('postgres')
  , _ = require('underscore');


module.exports = function(constring) {

  metadata = {}
  queries = {}

  return { 
    loadMetadata: function(fn) {
      /* this will return a key/value store of tables, columns, and types
       * i.e. {
       *  "foo": [
       *    {"name": "column_a", "type": "varchar"},
       *    {"name": "column_b", "type": "bigint"}
       *    ],
       *  "bar": [
       *    {"name": "column_a", "type": "float8"},
       *    {"name": "column_b", "type": "datetime"},
       *    ]
       * }
       */ 
      this.execute(sqlqueries.metadata, function(err, result) {
        /*
         * expecting something like this:
         * [
         *  {"table": "foo", "column": "column_a", type: "varchar"},
         *  {"table": "foo", "column": "column_b", type: "bigint"},
         *  {"table": "bar", "column": "column_a", type: "float8"}
         * ]
         */
        if (err) {
          return fn(err, null);
        }
        var meta = {};
        result.forEach(function(row) {
          if ( ! _.has(meta, row.table)) {
            meta[row.table] = [];
          }
          meta[row.table].push({
            name: row.column,
            type: row.type
          });
        });
        metadata = meta;
        fn(null, meta);
      });
    },
    typeAhead : function(table, text, tokens, fn) {
      //TODO: one of these isn't going to work
      var rgx_search = new RegExp(".*" + text + ".*", 'g');
      var matched_tokens = _.filter(tokens || [], function(t) {
        return rgx_search.exec(t.name);
      })
      if (table==null) {
        var results = _.filter(_.keys(metadata), function(i) {
          return rgx_search.exec(i);
        });
        results = results.map(function(name) {
          return { name: name, type: "table" };
        });
        fn(null, results.concat(matched_tokens));
      } else if (_.has(metadata, table)) {
        var results = _.filter(metadata[table], function(i) {
          return rgx_search.exec(i.name);
        });
        fn(null, results.concat(matched_tokens));
      } else {
        fn("Did not work", null);
      }
    },
    execute : function(querystring, fn) {
      _id = querystring;
      if (_.has(queries, _id)) {
        console.error("duplicate query executing!");
        console.error(_id);
        // return fn("duplicate query currently executing", null);
      }

      queries[_id] = "go";
      var rows = [];
      pg.connect(constring, function(err, db, done) {
        delete queries[_id];
        console.error("executing -->");
        console.error(querystring);
        db.query(querystring, function(err, result) {
          done();
          if (err) {
            fn(err, null);
          } else {
            fn(err, result.rows);
          }
        });
        /*
        query.on("row", function(row) {
          rows.push(row);
        });
        query.on("error", function(err) {
          delete queries[_id];
          fn(err, null);
          done();
        });
        query.on("end", function(result) {
          delete queries[_id];
          fn(null, rows);
          console.error(rows.length + ' rows were received');
          done();
        });
        */
      });
    },
    kill : function(query_id, fn) {
      if (_.has(queries, query_id)) {
        queries[query_id] = "kill";
      }
    }
  }
}
