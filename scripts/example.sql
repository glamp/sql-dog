select
    *
from
    beer_reviews b
where    
    b.review_overall > 4
limit 1000;

