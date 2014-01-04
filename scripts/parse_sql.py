#!/usr/bin/env python
import sys
import sqlparse




sql = """select
    *
from
    beer_reviews b
where    
    b.review_overall > 4
limit 1000;
"""


for query in sqlparse.parse(sql):
    for token in query.tokens:
        print token

print "*"*80
print sqlparse.format(query, reindent=True, keyword_case='upper',
        indent_tabs=False, indent_width=4)
