var pg = require('pg')
  , sqlqueries = require('./queries')('postgres')
  , _ = require('underscore')
  , lev = require('levenshtein')
  , fuzzy = require('fuzzy-filter');

escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


module.exports = function(constring) {

  metadata = {}
  GLOBAL.queries = {}

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
      this.execute(sqlqueries.metadata, -1, function(err, result) {
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

      if (table==null) {
        var possibles = _.keys(metadata).map(function(name) {
          return { name: name, type: "table" };
        });
        //TODO: this is just annoying
        // possibles = possibles.concat(tokens);
      } else {
        if (_.has(metadata, table)) {
          var possibles = metadata[table]
        } else {
          var possibles = [];
          console.log("table not found!: " + table);
        }
      }
      possibles = possibles.map(function(item) {
        item.dist = lev(item.name, text);
        return item;
      });
      possibles = _.sortBy(possibles, function(item) {
        return -(text.length / item.dist.toFixed(2));
      });

      var results = fuzzy(text, _.pluck(possibles, 'name'));
      var results = results.map(function(result) {
        var item = _.findWhere(possibles, { name: result });
        item.dist = lev(text, item.name) / text.length.toFixed(2);
        return item;
      });
      results = _.sortBy(results, function(item) {
        return item.dist;
      });
      fn(null, results);
    },
    execute : function(querystring, limit, fn) {
      console.log(querystring);
      _id = querystring;
      limit = limit || 10000;
      if (_.has(queries, _id)) {
        console.error("duplicate query executing!");
        console.error(_id);
        // return fn("duplicate query currently executing", null);
      }

      queries[_id] = "go";
      var rows = [];
      pg.connect(constring, function(err, db, done) {
        if (limit > 0) {
          query = querystring.replace(/;$/, "");
          querystring = "select * from (" + query + ") as t limit " + limit;
        }
        db.query(querystring, function(err, result) {
          delete queries[_id];
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
