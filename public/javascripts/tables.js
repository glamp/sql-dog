
addTable = function(table_id, records) {
  if (_.isEmpty(records)) {
    console.log("no data returned!");
    return;
  }
	$("#results-list").append('<li class=""><a href="#' + table_id + '" data-toggle="tab"><button class="close" type="button"><span class="glyphicon glyphicon-remove"></span></button>' + table_id + '</a></li>');
	$("#results-tabs").append('<div id="' + table_id + '" class="tab-pane"><table id="table-' + table_id+ '"></table></div>');
	var cols = _.keys(_.first(records));
	cols = _.map(cols, function(c) {
		return "<th>" + c + "</th>";
	});
	cols = "<thead>" + cols + "</thead>";
	$('#table-' + table_id).attr("class", "table table-striped table-bordered table-hover");
	$('#table-' + table_id).append(cols);
	$('#table-' + table_id).dynatable({
		dataset: {
			records: records,
			features: {
				search: false
			}
		}
	});
	bindClose();
	// $("#results-list").children().attr("class", "");
	// $("#results-list").children().last().attr("class", "active");
}

addTable = function(table_id, records) {
	'<table class="table table-striped table-bordered table-hover">
	    <thead>
	      <tr>
	        <th>#</th>
	        {{#cols}}
	        	<th>{{ . }}</th>
	        {{/cols}}
	      </tr>
	    </thead>
	    <tbody>
	      {{#rows}}
	      <tr>
	        <td>{{ N }}</td>
	      	{{#values}}
	        <td>{{ . }}</td>
	        {{/values}}
	      </tr>
	      {{/rows}}
	    </tbody>
	</table>
	'
}

createModalTable = function(records) {
	var _id = 'result-table'
    if (_.isEmpty(records)) {
      console.log("no data returned!");
      return;
    }
	var cols = _.keys(_.first(records));
	cols = _.map(cols, function(c) {
		return "<th>" + c + "</th>";
	});
	cols = "<thead>" + cols + "</thead>";
	$('#result-table').attr("class", "table table-striped table-bordered table-hover");
	$('#result-table').append(cols);
	$('#result-table').dynatable({
		dataset: {
			records: records,
			features: {
				search: false
			}
		}
	});
	$("#result-modal").modal({keyboard: true});
}

openInNewWindow = function(title, tableHtml) {
	var newWindow = window.open();
	var header = [
		'<head>',
		'<script src="/javascripts/jquery-1.8.0.min.js"></script>',
		'<link rel="stylesheet" media="all" href="/dynatable/jquery.dynatable.css" />',
		'<script src="/dynatable/jquery.dynatable.js" type="text/javascript"></script>',
		"<link rel='stylesheet' href='/themes/flatly.bootstrap.min.css' />",
		"<link rel='stylesheet' href='/stylesheets/results.css' />",
		'</head>'
	].join("\n");

	newWindow.document.write("<!DOCTYPE html><html><title>" + title + "</title>" + header + "<body>" + tableHtml + "</body></html>");
  return newWindow;
}