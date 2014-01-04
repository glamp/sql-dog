# SQL IDE
Currently there aren't any good OSX SQL IDE options. In fact, most SQL IDE's 
have too many features that concentrate on exploiting the features of...SQL.

- querying in the browser
- saving results
- saving queries
- predictive type
- database inspection (looking at tables, finding columns, etc.)

## What is it?
A web based SQL IDE. I would prefer it to be a native app, but we'll start with
web-based for simplicity.

## Why is it?
Too many SQL IDEs focus on providing a GUI for SQL. When they've finished 
building out basic features for writing queries, they immediately turn to more
admin-centric features like adding and removing tables, importing data, managing
schemas, etc.

In reality, most people don't actually use these features. Most people aren't 
db-admins, they're analysts who need to *query* data (not manage it). So instead
we're going to focus on providing features for the 90-95% of users who need to 
get data out of a database, not manage it.

## Basic Components / Things it does
We'll have a single page app that has a basic client/server configuration.

### `server`
We'll use web-sockets for the server since we're going to have *a lot* of 
data going back and forth and it also needs to be super fast. We will need
streams for doing the following:

#### `executing a query`
    - single query
    - bulk query to a CSV or Excel file

#### `type ahead`
    - cacheing the data
    - making a prediction for a given table

#### `saving data`
    - results
    - an actual query

#### `metadata`
   - tables and columns
   - ownership and permissions on tables/dbs

### `client`
The client will be all in JS/HTML and we'll have some web socket connections to 
provide all the data. We can use some HTML5 greatness to get a lot of our 
features for free. 

#### `text editing`
    - ACE editor window with keyboard shortcuts
    - highlighting in multiple colors/syntax styles (start w/ PG)
    - CMD + Space for type ahead (table names and columns)

#### `results`
    - return results to a table
    - customizeable table (long/wide, colors, width, sorting, etc.)
    - ability to save to a file (just stream data from a .xls/.csv endpoint)

#### `executing query`
    - ability to CMD + ENTER to execute a query
    - should be able to customize your shortcuts
    - also have a big, attention grabbing button to execute something

#### `templating`
    - use Mustache with templates for dynamic SQL queries
    - we can have a "preview" feature that will pseudo-execute the query in the
    browser

#### `saving queries`
    - save a query to a gist or to some other internal data store


## API

### Connecting
We're using `socket.io` to for the server/client interaction so to start using
it just do:

    var socket = io.connect();

### Executing a Single Query
Emit a message to the server with a key/value "query"

    socket.emit("type-ahead", { query: "select * from foo;" } );

There are 2 events you need to be listenting to in order to see/read results:

    socket.on("query-result", function(data) {
      // results come back here as a collection
      [{ foo: "bar" }, { foo: "baz" }]
    });

    socket.on("query-error", function(data) {
      // any errors come back here
      "it's not working!"
     });

### Killing a Query
You can kill a long running query using the `cancel-query` endpoint.

    socket.emit("cancel-query", { query_id: "abcd1234" } );

### Saving a Query
You can save queries the same way you save a gist.

    socket.emit("save", { query: "select * from foo:" });

### Listing Saved Files
You can list saved files and reopen them.

    socket.emit("list");
    socket.on("files", function(files) {
      console.log(files);
    });

### Opening a Saved File
You can open a saved file.

    socket.emit("open-file", { filename: "myfile.sql" } );
    socket.on("open-file", function(data) {
      console.log(data.filecontent);
    });

### Bulk CURL
Specify a query id and optionally pass in variables via the browser or a GET
request and use the variables to execute the query and output it to either a
.csv, JSON, or .xls.

You can also access this via REST

    $ curl localhost:3000/file/myfile.sql

