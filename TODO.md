# TODO

**~: server done**
**~~: server and UI done**

### Querying

- ~~add something to indicate a query is running~~
- ~~client-side SQL templates~~
- ~~add a button for executing a template~~
- ability to kill a query
- monitor long running queries
- ~~limit number of rows returned~~
- add sql parser (why again?)
- warn if a template will execute a shitload of queries (i sort of hate this)

### UI
- ~~add a UI~~
- Jessify the UI
- fix tabs so they display things before being clicked
- make right side panel toggleable
- make everything resizable
- tooltips for keyboard shortcuts

### Predictive Type

- ~~grabbing the "right" item~~
- ~~utilizing `tab` to complete~~
- ~~fix issue w/ it being 1 character behind~~
- colorize based on what type of thing it is (?)
- ~~create a modal overlay~~
- add built in functions and keywords

### Results

- copy to clipboard features that is compatible with Excel
    - maybe just style the output differently?
    - needs to table-like but not actually a `<table>` for performance reasons
- ~~memory issues when displaying > 1000 rows~~
- make "plain" table prettier
- ~~display results on full screen as modal, then give option to delete or pin~~
- ~~make this configurable in Preferences~~
- ~~add "X" to close certain results~~
- ~~add download icon to export results~~
- ~add a "execute to file" feature~
- ~~hook up help to the actual help~~
- ~~ability to open results in new window~~
- ~~ability to auto-open results in new window~~
- ~~turn auto-open on/off~~

### Files

- ~~live-grep on gists~~ (WORKS AT ALL; some UI issues)
- ~~add in ability to create a new file~~
- ~~ability to rename files~~
- ~~ability to close files~~
- ~~ability to open files~~
- ~~add keyboard shortcuts to help (?)~~

### General

- add "application mode"; something that you can double click to run/open
- native app launcher for OSX
    - maybe [this](http://blog.coolaj86.com/articles/how-to-create-an-osx-pkg-installer.html)
    - ~~basic app that will open your browser to SQL Dog~~
    - safety component so you don't run 1000 SQL Dogs
    - app icon
    - bundle node and SQL Dog w/ app
    - UI for configuration (?)
- ~~SQL prettifier~~
- add an animal logo
- ~add in a searchable schema~ (works at all, looks terrible)
- ~~history (?)~~
- add in "?" with help and explanations
- add a man entry

## Databases

- add support for MySQL
- add support for MS SQL Server
- add support for something else (MongoDB?)

