var shell = require("shelljs");

(function() {
  //make shell global so we can call w/ $
  $ = function() {
    var cmd = [];
    for (var i = 0; i < arguments.length; i++) {
      cmd.push(arguments[i]);
    }
    cmd = cmd.join(" ");
    return shell.exec(cmd, {silent:true}).output
  }
  globalize = function() {
    GLOBAL.$ = $;
  }
  module.exports = {
    $: $,
    globalize: globalize
  }
}).call(this);
