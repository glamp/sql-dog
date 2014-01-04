
addTable = function(table_id, records) {
  if (_.isEmpty(records)) {
    console.log("no data returned!");
    return;
  }
	$("#results-list").append('<li class=""><a href="#' + table_id + '" data-toggle="tab">' + table_id + '</a></li>');
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
	// $("#results-list").children().attr("class", "");
	// $("#results-list").children().last().attr("class", "active");
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
