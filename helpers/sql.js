const { BadRequestError } = require('../expressError');

// THIS NEEDS SOME GREAT DOCUMENTATION.

/**
 * sqlForPartialUpdate
 * 
 * This is a helper function that maps the keys and values from dataToUpdate
 * to a new object containing the SQL string required for pg (SQL) to SET
 * new values.
 * 
 * If a given key in dataToUpdate exists in jsToSql, the key will be converted to
 * the SQL column name: firstName -> first_name, in order for the UPDATE statement
 * to refer to the correct column name. Otherwise, the original keys in dataToUpdate
 * will be used.
 * 
 * setCols is the formatted partial SQL string that will set columns to the values:
 * "first_name" = $1 
 * 
 * values: is the the array of parameterized values to be changed in the db:
 * Array of values to be spread in the Prepared Statements.
 * 
 * If dataToUpdate object has no keys:
 *    Throws BadRequestError - 400
 * 
 * @param {Object.<string,string>} dataToUpdate - 
 * @param {Object.<string,string>} jsToSql 
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
	const keys = Object.keys(dataToUpdate);
	if (keys.length === 0) throw new BadRequestError('No data');

	// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
	const cols = keys.map((colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`);

	return {
		setCols : cols.join(', '),
		values  : Object.values(dataToUpdate)
	};
}

module.exports = { sqlForPartialUpdate };
