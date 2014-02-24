/*
* format - npm module plugin to pretty-print or minify text in XML, JSON, CSS and SQL formats.
* https://github.com/stonephp/formattor
*
* Version - 0.0.2
* Copyright (c) 2013 Redstone Zhao
* https://github.com/stonephp/formattor
*
* Based on jQuery-format by Zach Shelton
* https://github.com/zachofalltrades/jquery.format
*
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*
*/

/**
 * utility function called from constructor of Formatter
 */
function createShiftArr(step) {
  var space = '    ';
  if ( isNaN(parseInt(step)) ) {  // argument is string
    space = step;
  } else { // argument is integer
    space = new Array(step + 1).join(' '); //space is result of join (a string), not an array
  }
  var shift = ['\n']; // array of shifts
  for(var ix=0;ix<100;ix++){
    shift.push(shift[ix]+space);
  }
  return shift;
};

/**
 *
 */
function isSubquery(str, parenthesisLevel) {
  return  parenthesisLevel - (str.replace(/\(/g,'').length - str.replace(/\)/g,'').length );
};

/**
 *
 */
function split_sql(str, tab) {
  return str.replace(/\s{1,}/g," ")
  .replace(/ AND /ig,"~::~"+tab+"AND ")
  .replace(/ BETWEEN /ig,"~::~"+tab+"BETWEEN ")
  .replace(/ CASE /ig,"~::~"+tab+"CASE ")
  .replace(/ ELSE /ig,"~::~"+tab+"ELSE ")
  .replace(/ END /ig,"~::~"+tab+"END ")
  .replace(/ FROM /ig,"~::~FROM\n" + tab)
  .replace(/ GROUP\s{1,}BY/ig,"~::~GROUP BY\n"+tab)
  .replace(/ HAVING /ig,"~::~HAVING ")
  .replace(/ LIMIT /ig,"~::~LIMIT ")
  //.replace(/ SET /ig," SET~::~")
  .replace(/ IN /ig," IN ")
  .replace(/ JOIN /ig,"~::~JOIN ")
  .replace(/ CROSS~::~{1,}JOIN /ig,"~::~CROSS JOIN ")
  .replace(/ INNER~::~{1,}JOIN /ig,"~::~INNER JOIN ")
  .replace(/ LEFT~::~{1,}JOIN /ig,"~::~LEFT JOIN ")
  .replace(/ RIGHT~::~{1,}JOIN /ig,"~::~RIGHT JOIN ")
  .replace(/ ON /ig,"~::~"+tab+"ON ")
  .replace(/ OR /ig,"~::~"+tab+"OR ")
  .replace(/ ORDER\s{1,}BY/ig,"~::~ORDER BY ")
  .replace(/ OVER /ig,"~::~"+tab+"OVER ")
  .replace(/\(\s{0,}SELECT /ig,"~::~(SELECT ")
  .replace(/\)\s{0,}SELECT /ig,")~::~SELECT ")
  .replace(/ THEN /ig," THEN~::~"+tab+"")
  .replace(/ UNION /ig,"~::~UNION~::~")
  .replace(/ USING /ig,"~::~USING ")
  .replace(/ WHEN /ig,"~::~"+tab+"WHEN ")
  .replace(/ WHERE /ig,"~::~WHERE\n"+tab)
  .replace(/ WITH /ig,"~::~WITH ")
  //.replace(/\,\s{0,}\(/ig,",~::~( ")
  //.replace(/\,/ig,",~::~"+tab+tab+"")
  .replace(/ ALL /ig," ALL ")
  .replace(/ AS /ig," AS ")
  .replace(/ ASC /ig," ASC ")
  .replace(/ DESC /ig," DESC ")
  .replace(/ DISTINCT /ig," DISTINCT ")
  .replace(/ EXISTS /ig," EXISTS ")
  .replace(/ NOT /ig," NOT ")
  .replace(/ NULL /ig," NULL ")
  .replace(/ LIKE /ig," LIKE ")
  .replace(/\s{0,}SELECT /ig,"SELECT\n"+tab)
  .replace(/\s{0,}UPDATE /ig,"UPDATE\n"+tab)
  .replace(/ SET /ig," SET ")
  .replace(/~::~{1,}/g,"~::~")
  .split('~::~');
};


var Formatter = function (options) {
  this.init(options);
  //TODO - if options object maps any functions, add them as appropriately named methods
  var methodName = this.options.method;
  if (!this[methodName]) {
    throw Error("'" + methodName + "' is not a Formatter method.");
  };
  this.format = function(text) { //alias to currently selected method
    return this[this.options.method].call(this, text);
  };
};


/**
 * putting the methods into the prototype instead of the constructor method
 * enables more efficient on-the-fly creation of Formatter instances
 */
Formatter.prototype = {
  options: {},

  init: function(options) {
    /**
     * default configuration
     */
    var _defaults = {
      method: 'sql', // the method to be called
      step: '    ', // 4 spaces
      preserveComments: false 
    };
    this.options = options || {};
    for(var key in _defaults) {
      if(!this.options.hasOwnProperty(key)) {
        this.options[key] = _defaults[key];
      }
    }
    this.step = this.options.step;
    this.preserveComments = this.options.preserveComments;
    this.shift = createShiftArr(this.step);
  },

  sql: function(text) {

    var ar_by_quote = text.replace(/\s{1,}/g," ")
                .replace(/\'/ig,"~::~\'")
                .split('~::~'),
      len = ar_by_quote.length,
      ar = [],
      deep = 0,
      tab = this.step,//+this.step,
      parenthesisLevel = 0,
      str = '',
      ix = 0;

      for(ix=0;ix<len;ix++) {
        if(ix%2) {
          ar = ar.concat(ar_by_quote[ix]);
        } else {
          ar = ar.concat(split_sql(ar_by_quote[ix], tab) );
        }
      }

      len = ar.length;
      for(ix=0;ix<len;ix++) {

        parenthesisLevel = isSubquery(ar[ix], parenthesisLevel);

        if( /\s{0,}\s{0,}SELECT\s{0,}/.exec(ar[ix]))  {
          ar[ix] = ar[ix].replace(/\,/g,"\n"+tab+",");
        }

        if( /\s{0,}\s{0,}SET\s{0,}/.exec(ar[ix]))  {
          ar[ix] = ar[ix].replace(/\,/g,",\n"+tab+tab+"");
        }

        if( /\s{0,}\(\s{0,}SELECT\s{0,}/.exec(ar[ix]))  {
          deep++;
          str += this.shift[deep]+ar[ix];
        } else
        if( /\'/.exec(ar[ix]) )  {
          if(parenthesisLevel<1 && deep) {
            deep--;
          }
          str += ar[ix];
        }
        else  {
          str += this.shift[deep]+ar[ix];
          if(parenthesisLevel<1 && deep) {
            deep--;
          }
        }
      }
      str = str.replace(/^\n{1,}/,'').replace(/\n{1,}/g,"\n");
      return str;
  },

  sqlmin: function(text) {
    return text.replace(/\s{1,}/g," ").replace(/\s{1,}\(/,"(").replace(/\s{1,}\)/,")");
  }

};//end Formatter.prototype


/**
 * utility version
 */
module.exports = function(text, options) {
  options = options || { medthod: 'sql' };
  var fmt = new Formatter(options);
  return fmt.format(text);
};
