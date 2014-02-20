
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

addTable2 = function(table_id, records) {
	var li = '<li class=""><a href="#' + table_id + '" data-toggle="tab">';
	li += '<button class="close" type="button"><span class="glyphicon glyphicon-remove">'
	li += '<button class="download" type="button"><span class="glyphicon glyphicon-download-alt">'
	li += '</span></button>' + table_id + '</a></li>';
	$("#results-list").append(li);
	$("#results-tabs").append('<div id="' + table_id + '" class="tab-pane"><table id="table-' + table_id+ '"></table></div>');
	var cols = _.keys(_.first(records));
	table_template = ''
	table_template += '<table class="table table-striped table-bordered table-hover">\n'
	table_template += '	    <thead>\n'
	table_template += '	      <tr>\n'
	table_template += '	        <th>#</th>\n'
	table_template += '	        {{#cols}}\n'
	table_template += '	        <th>{{ . }}</th>\n'
	table_template += '	        {{/cols}}\n'
	table_template += '	      </tr>\n'
	table_template += '	    </thead>\n'
	table_template += '	    <tbody>\n'
	table_template += '	      {{#rows}}\n'
	table_template += '	      <tr>\n'
	table_template += '	        <td>{{ idx }}</td>\n'
	cols.forEach(function(col) {
		table_template += '	    	<td>{{ ' + col + '}}</td>\n'
	});
	table_template += '	      </tr>\n'
	table_template += '	      {{/rows}}\n'
	table_template += '	    </tbody>\n'
	table_template += '	</table>'
	idx = 1;
	records.forEach(function(record) {
    if (idx > parseInt($("#rows-returned").val())) {
      return;
    }
		record.idx = idx;
		idx++;
	});
	$('#table-' + table_id).append(Mustache.render(table_template, { cols: cols, rows: records }));
	bindClose();
	bindDownload();
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
