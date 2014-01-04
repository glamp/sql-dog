import re


sql = """
SELECT
    *
FROM
    foo a
WHERE
    a.blah = 1
    and a.blah in (select one from bar f)
LIMIT 100;
"""

alias = {}

rgx = "(FROM|JOIN|from|join)[ \t\r\n]+([A-Za-z0-9_]+) ([A-Za-z0-9_]+)"

for match in re.findall(rgx, sql):
    alias[match[2]] = match[1]

print alias