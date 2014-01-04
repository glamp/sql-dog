

sql = "SELECT \
    * \
    FROM \
    foo a \
    WHERE \
    a.blah = 1 \
    and a.blah in (select one from bar f) \
    LIMIT 100; "

var rgx = new RegExp("(FROM|JOIN|from|join)[ \t\r\n]+([A-Za-z0-9_]+) ([A-Za-z0-9_]+)", 'g');

var match = rgx.exec(sql)
var alias = {}
while (match) {
	alias[match[3]] = match[2];
	sql = sql.slice(match.index);
	match = rgx.exec(sql)	
}
console.log(alias);