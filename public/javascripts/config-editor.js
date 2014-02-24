escapeRegExp = function(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

getAllTokens = function(editor) {
  var lines = editor.session.getLines(0, editor.session.getLength());
  var tokens = {};
  lines.forEach(function(line) {
    line.split(' ').forEach(function(word) {
      tokens[word] = (tokens[word] || 0) + 1;
    });
  });
  return _.keys(tokens).map(function(t) { return { name: t, type: "token" } });
}

findPrevToken = function(editor) {
    var current_row = editor.session.getLine(editor.getCursorPosition().row);
    return current_row.split(/[ (]/)
                      .slice(-1)[0]
                      .slice(0, -1)
                      .trim();
}

findPredText = function(editor) {
    var row = editor.getCursorPosition().row
      , cursor_col = editor.getCursorPosition().column;

    var line = editor.session.getLine(row)
        , text = "";

    col = cursor_col;
    while (col > 0 && text.indexOf(".") < 0) {
      text = line.slice(col, cursor_col + 1);
      col--;
    }
  return text.slice(1);
}

findTableName = function(editor, query, alias) {

  var rgx = new RegExp("(FROM|JOIN|from|join)[ \t\r\n]+([A-Za-z0-9_]+) ([A-Za-z0-9_]+)", 'g');

  var match = rgx.exec(query)
  var all_alias = {}
  while (match) {
    all_alias[match[3]] = match[2];
    query = query.slice(match.index);
    match = rgx.exec(query) 
  }

  return (all_alias[alias] || null);

  // var rgx = new RegExp('([A-Za-z_0-9]+) ' + escapeRegExp(alias), 'g');
  // var i = editor.getCursorPosition().row
  // var line = editor.session.getLine(i);
  // while (rgx.test(line)!=true && i < 1000) {
  //   i += 1;
  //   line = editor.session.getLine(i);
  // }
  // if (rgx.test(line)==false) {
  //   var i = editor.getCursorPosition().row
  //   while (rgx.test(line)!=true && i > 0) {
  //     i -= 1;
  //     line = editor.session.getLine(i);
  //   }
  // }
  // // console.log(line);
  // rgx.exec(line);
  // return rgx.exec(line)[1];
}

insertCharacter = function(editor, ch) {
    if (editor.selection.rangeCount > 0) {
        editor.selection.getAllRanges().forEach(function(range) {
            editor.session.insert(range.cursor, ch)
        });
    } else {
        editor.insert(ch);
    }
}

extractQuery = function(editor) {
    var current_row = editor.getCursorPosition().row;

    var last_query_row = current_row;
    while (last_query_row <= editor.session.getLength()
        & /;/g.test(editor.session.getLine(last_query_row))==false) {
        last_query_row++;
    }

    var first_query_row = current_row;
    while ((first_query_row > 0 & /;/g.test(editor.session.getLine(first_query_row))==false)
        || first_query_row==last_query_row) {
        first_query_row--;
    }
    return editor.session.getLines(first_query_row, last_query_row).join("\n").trim();
}

sendQuery = function(editor) {
    var query = editor.session.getTextRange(editor.getSelectionRange()).trim();
    if (query.indexOf("{{#") > 0) {
      var userdata = query.split('\n')[0];
      query = query.split('\n').slice(1).join('\n');

      if (userdata.indexOf(" (") > -1) {
        var userdata_query = userdata.split(' = ').slice(1).join("");
        var results = null;
        $.post("/query", { query: userdata_query }, function(data) {
          results = data.results;
          var varname = userdata.split(' = ')[0];
          userdata = {};
          userdata[varname] = results;
          var queries = Mustache.render(query, userdata);
          queries.split(';').forEach(function(query) {
            if (query!="") {
              $("#recent-queries").append("<li><pre id='insert-on-click'>" + query + "</pre></li>");
              socket.emit("query", {
                query: query,
                n: parseInt($("#rows-returned").val())
              });
            }
          });
        });
      } else {
        userdata = eval(userdata);
        var queries = Mustache.render(query, userdata);
        queries.trim().split(';').forEach(function(query) {
          if (query!="") {
            $("#recent-queries").append("<li><pre>" + query + "</pre></li>");
            socket.emit("query", {
              query: query,
              n: parseInt($("#rows-returned").val())
            });
          }
        });
      }
    } else {
      if (query.length==0) {
        query = extractQuery(editor);
      }
      $("#recent-queries").append("<li><pre>" + query + "</pre></li>");
      socket.emit("query", {
        query:  query,
        n: parseInt($("#rows-returned").val())
      });
    }
}


setupEditor = function(id, socket) {
  var editor = ace.edit(id);
  editor.setTheme("ace/theme/cobalt");
  editor.getSession().setMode("ace/mode/pgsql");

  // keyboard shortcuts for executing a query
  editor.commands.addCommand({
    name: 'sendCommand',
    bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
    exec: function(editor) {
      sendQuery(editor);
    }
  });

  // keyboard shortcuts for executing a template query
  editor.commands.addCommand({
    name: 'sendTemplateQuery',
    bindKey: {win: 'Ctrl-Shift-Enter',  mac: 'Command-Shift-Enter'},
    exec: function(editor) {
      var query = editor.session.getTextRange(editor.getSelectionRange()).trim();
      var userdata = query.split('\n')[0];
      query = query.split('\n').slice(1).join('\n');

      if (userdata.indexOf(" (") > -1) {
        var userdata_query = userdata.split(' = ').slice(1).join("");
        var results = null;
        $.post("/query", { query: userdata_query }, function(data) {
          results = data.results;
          var varname = userdata.split(' = ')[0];
          userdata = {};
          userdata[varname] = results;
          var queries = Mustache.render(query, userdata);
          queries.split(';').forEach(function(query) {
            if (query!="") {
              $("#recent-queries").append("<li><pre>" + query + "</pre></li>");
              socket.emit("query", { query: query });
            }
          });
        });
      } else {
        userdata = eval(userdata);
        var queries = Mustache.render(query, userdata);
        queries.trim().split(';').forEach(function(query) {
          if (query!="") {
            $("#recent-queries").append("<li><pre>" + query + "</pre></li>");
            socket.emit("query", { query: query });
          }
        });
      }
    }
  });

  // type ahead
  editor.commands.addCommand({
    name: 'predType',
    // maybe change this to tab?
    bindKey: {win: 'Ctrl-Space',  mac: 'Ctrl-Space'},
    exec: function(editor) {
      editor.predMode = true
      editor.predChars = "";
      editor.table = null;
      socket.emit("type-ahead", { table: null, text: "" , tokens: getAllTokens(editor) });
    }
  });

  editor.commands.addCommand({
    name: 'exitPredMode',
    bindKey: {win: 'ESC', mac: 'ESC'},
    exec: function(editor) {
      if (editor.predMode==true) {
        editor.predMode = false;
      }
      editor.predChars = "";
      editor.selection.clearSelection();
      $("#pred-modal").modal('hide');
      $("#result-modal").modal('hide');
    }
  });

  editor.commands.addCommand({
    name: 'showStarCols',
    bindKey: {win: 'Ctrl-j', mac: 'Ctrl-j'},
    exec: function(editor) {
      var alias = findPrevToken(editor)
        , table = findTableName(editor, extractQuery(editor), alias);
      //TODO: insert cols into editor...
      console.log("show columns for: " + table);
    }
  })

  editor.commands.addCommand({
    name: 'dotPred',
    bindKey: {win: '.', mac: '.'},
    exec: function(editor) {
      // TODO: not working!!!
      editor.predMode = true;
      editor.predChars = "";
      // should find the last token (newline, space, SQL operator (SELECT/WHERE/FROM))
      insertCharacter(editor, ".")
      var alias = findPrevToken(editor)
          , table = findTableName(editor, extractQuery(editor), alias);
      editor.table = table;
      socket.emit("type-ahead", { table: table, text: editor.predChars, tokens: getAllTokens(editor) });
    }
  });

  editor.commands.addCommand({
    name: 'tabComplete',
    bindKey: {win: 'tab', mac: 'tab'},
    exec: function(editor) {
      if (editor.predMode==true) {
        editor.selection.selectLeft()
        if (editor.session.getTextRange(editor.getSelectionRange())==".") {
          editor.selection.selectRight()
        } else {                  
          editor.selection.selectRight()
          editor.removeWordLeft()                    
        }
        insertCharacter(editor, $("#guesses .best").first().text());
        editor.predMode = false;
        $("#pred-modal").modal('hide')
      } else {
        insertCharacter(editor, "\t")
      }
    }
  });


  editor.commands.addCommand({
    name: 'enterComplete',
    bindKey: {win: 'enter', mac: 'enter'},
    exec: function(editor) {
      if (editor.predMode==true) {
        editor.selection.selectLeft()
        if (editor.session.getTextRange(editor.getSelectionRange())==".") {
          editor.selection.selectRight()
        } else {                  
          editor.selection.selectRight()
          editor.removeWordLeft()                    
        }
        insertCharacter(editor, $("#guesses .best").first().text());
        editor.predMode = false;
        $("#pred-modal").modal('hide')
      } else {
        insertCharacter(editor, "\n")
      }
    }
  });

  editor.commands.addCommand({
    name: 'up-arrow',
    bindKey: {win: 'Up', mac: 'Up'},
    exec: function(editor) {
      if (editor.predMode==true) {
        if ($("#guesses .best").prev().length==0) {
          $("#guesses li").last().addClass("best");
          $("#guesses .best").first().removeClass("best");
        } else {
          $("#guesses .best").prev().addClass("best");
          $("#guesses .best").last().removeClass("best");
        }
      } else {
        editor.navigateUp();
      }
    }
  });

  editor.commands.addCommand({
    name: 'down-arrow',
    bindKey: {win: 'Down', mac: 'Down'},
    exec: function(editor) {
      if (editor.predMode==true) {
        if ($("#guesses .best").next().length==0) {
          $("#guesses li").first().addClass("best");
          $("#guesses .best").last().removeClass("best");
        } else {
          $("#guesses .best").next().addClass("best");
          $("#guesses .best").first().removeClass("best"); 
        }
      } else {
        editor.navigateDown();
      }
    }
  });

  editor.onTextInput = function(text) {
    if (editor.predMode==true) {
      editor.predChars += text;
      socket.emit("type-ahead", {
        table: editor.table,
        text: findPredText(editor) + text,
        tokens: getAllTokens(editor)
      });
    }
    this.keyBinding.onTextInput(text);
  }

  $('#' + id).height($(window).height() - 300);
  return editor;
}
