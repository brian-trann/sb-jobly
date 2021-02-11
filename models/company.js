'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for companies. */

class Company {
	/** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

	static async create({ handle, name, description, numEmployees, logoUrl }) {
		const duplicateCheck = await db.query(
			`SELECT handle
           FROM companies
           WHERE handle = $1`,
			[ handle ]
		);

		if (duplicateCheck.rows[0]) throw new BadRequestError(`Duplicate company: ${handle}`);

		const result = await db.query(
			`INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
			[ handle, name, description, numEmployees, logoUrl ]
		);
		const company = result.rows[0];

		return company;
	}

	/** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

	static async findAll(data) {
		let whereInsertion = '';
		let values;

		if (Object.keys(data || {}).length > 0) {
			const { whereClause, paramValues } = Company.dataToFilterBy(data);
			whereInsertion += 'WHERE ' + whereClause;
			values = paramValues;
		}

		const companiesRes = await db.query(
			`SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
        FROM companies
        ${whereInsertion}
        ORDER BY name`,
			values
		);

		return companiesRes.rows;
	}

	/**
   * dataToFilterBy 
   * 
   * This is a helper function that creates a SQL WHERE clause and parameterized 
   * values given valid query parameters. 
   * 
   * whereClause is the formatted partial SQL string that will be the where condition:
   *    "num_employees >= $1"
   * 
   * paramValues is the parameterized array of values that will correspond to each whereClause:
   * This array is to be the second argument in the db.query
   *    ['1']
   * 
   * If a single key in the data object is not allowed:
   *     Throws BadRequestError
   * 
   * If minEmployees > maxEmployees || minEmployees < 0: 
   *    Throws BadRequestError
   * 
   * @param {Object.<string,string>} data 
   * data is the raw request query parameters to be validated and to be filtered by
   * 
   * @param {String[]} filters - String array of allowed filtering query parameters
   * The default query params are: 'name', 'minEmployees', and 'maxEmployees'.
   * 
   * @return {FilterBy} { whereClause: String, paramValues: Array of parameterized values}
   */
	static dataToFilterBy(data, filters) {
		const allowedParameters = filters || [ 'name', 'minEmployees', 'maxEmployees' ];
		const allowed = Object.keys(data).every((key) => allowedParameters.includes(key));
		if (!allowed) throw new BadRequestError('A search parameter was not allowed');
		const { minEmployees, maxEmployees, name } = data;

		const whereArr = [];
		const paramValues = [];

		if (+minEmployees > +maxEmployees) {
			throw new BadRequestError(
				`minEmployees(${minEmployees}) can not be greather than maxEmployees(${maxEmployees})`
			);
		} else if (+minEmployees < 0) {
			throw new BadRequestError('Minimum employees can not be negative');
		}

		if (minEmployees) {
			paramValues.push(minEmployees);
			whereArr.push(`num_employees >= $${paramValues.length}`);
		}
		if (maxEmployees) {
			paramValues.push(maxEmployees);
			whereArr.push(`num_employees <= $${paramValues.length}`);
		}
		if (name) {
			paramValues.push(name);
			whereArr.push(`name ~* $${paramValues.length}`);
		}

		return {
			whereClause : whereArr.join(' AND '),
			paramValues
		};
	}

	/** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

	static async get(handle) {
		const companyRes = await db.query(
			`SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
			[ handle ]
		);

		const company = companyRes.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

	static async update(handle, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			numEmployees : 'num_employees',
			logoUrl      : 'logo_url'
		});
		const handleVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
		const result = await db.query(querySql, [ ...values, handle ]);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);

		return company;
	}

	/** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

	static async remove(handle) {
		const result = await db.query(
			`DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
			[ handle ]
		);
		const company = result.rows[0];

		if (!company) throw new NotFoundError(`No company: ${handle}`);
	}
}

module.exports = Company;
