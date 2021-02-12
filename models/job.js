'use strict';

const db = require('../db');
const { NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Job functions */
class Job {
	/**
   * Create a job
   */
	static async create({ title, salary, equity, companyHandle }) {
		const res = await db.query(
			`INSERT INTO jobs (title,
                        salary,
                        equity,
                        company_handle)
          VALUES ($1, $2, $3, $4)
          RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
			[ title, salary, equity, companyHandle ]
		);
		const job = res.rows[0];
		return job;
	}

	/** Find all jobs
   * 
   * @param {*} data optional query string parameter to filter by:
   * Optional filters:
   *    -minSalary
   *    -hasEquity
   *    -title
   * 
   * Returns Array of Jobs [{ id, title, salary, equity, companyHandle, companyName }, ...]
   */
	static async findAll(data) {
		const { title, minSalary, hasEquity } = data;
		const whereClause = [];
		const values = [];
		let whereInsertion = '';

		if (title) {
			values.push(title);
			whereClause.push(`title ~* $${values.length}`);
		}
		if (minSalary) {
			values.push(minSalary);
			whereClause.push(`salary >= $${values.length}`);
		}
		if (hasEquity) {
			whereClause.push('equity > 0');
		}
		if (whereClause.length > 0) {
			whereInsertion = 'WHERE ' + whereClause.join(' AND ');
		}

		const jobsResults = await db.query(
			`SELECT j.id,
              j.title,
              j.salary,
              j.equity,
              j.company_handle AS "companyHandle",
              c.name AS "companyName"
          FROM jobs AS j
          LEFT JOIN companies AS c
          ON c.handle = j.company_handle
          ${whereInsertion}`,
			values
		);
		return jobsResults.rows;
	}

	/** Get Job by ID
   * 
   * 
   */
	static async get(id) {
		const jobResult = await db.query(
			`SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`,
			[ id ]
		);

		const job = jobResult.rows[0];

		if (!job) throw new NotFoundError(`No Job: ${id}`);

		const companyResult = await db.query(
			`SELECT name,
              num_employees,
              description,
              logo_url
          FROM companies
          WHERE handle = $1`,
			[ job.companyHandle ]
		);
		job.company = companyResult.rows[0];
		return job;
	}
	/**
   * Update a Job's data with {data}
   * 
   * This is a "partial update" ---  it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {});
		const idVarIdx = '$' + (values.length + 1);
		const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id,
                          title,
                          salary,
                          equity,
                          company_handle AS "companyHandle"`;
		const res = await db.query(querySql, [ ...values, id ]);
		const job = res.rows[0];

		if (!job) throw new NotFoundError(`No Job ID: ${id}`);
		return job;
	}
	/**
   * Delete a job by ID, returns undefined
   * Throws NotFoundError if job not found
   */
	static async remove(id) {
		const res = await db.query(
			`DELETE FROM jobs
      WHERE id = $1
      RETURNING id`,
			[ id ]
		);
		const job = res.rows[0];
		if (!job) throw new NotFoundError(`No Job ID: ${id}`);
	}
}

module.exports = Job;
