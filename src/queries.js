
module.exports = function(lang) {
  if (lang=="postgres") {
    return {
      metadata: "select table_name as table, column_name as column, udt_name as type from information_schema.columns;"
    }
  }
}
