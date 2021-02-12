'use strict';
/** Routes for jobs */

const express = require('express');
const jsonschema = require('jsonschema');

const { BadRequestError } = require('../expressError');
const { ensureAdmin } = require('../middleware/auth');
const Job = require('../models/jobs');

// API validation
const jobNew = require('../schemas/jobNew.json');
const jobQuery = require('../schemas/jobQuery.json');
const jobUpdate = require('../schemas/jobUpdate.json');

const router = express.Router();

/** POST / { job }  => { job}
 *
 * Adds a job.  Job should be: { title, salary, equity, companyHandle}
 * 
 * Returns: {id, title, salary, equity, companyHandle}
 *
 * Authorization required: admin
 **/
router.post('/', ensureAdmin, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, jobNew);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (error) {
		return next(error);
	}
});

/**
 * GET / {jobs:[{},...]}
 *  
 * Can filter on provided search filters:
 * - minSalary
 * - hasEquity
 * - title
 * Authorization required: none
 */

router.get('/', async (req, res, next) => {
	try {
		const query = req.query;
		if (query.minSalary !== undefined) {
			query.minSalary = +query.minSalary;
		}

		query.hasEquity = query.hasEquity === 'true' ? true : false;

		const validator = jsonschema.validate(query, jobQuery);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		const jobs = await Job.findAll(query);
		return res.json({ jobs });
	} catch (error) {
		return next(error);
	}
});
/**
 * GET / [id] - find a JOB by ID
 * 
 * Authorization required: none
 */

router.get('/:id', async (req, res, next) => {
	try {
		const job = await Job.jet(req.params.id);
		return res.json({ job });
	} catch (error) {
		return next(error);
	}
});

/**
 * UPDATE / [id] - UPDATE A JOB
 * 
 * Authorization required: admin
 */
router.patch('/:id', ensureAdmin, async (req, res, next) => {
	try {
		const validator = jsonschema.validate(req.body, jobUpdate);
		if (!validator.valid) {
			const errs = validator.errors.map((e) => e.stack);
			throw new BadRequestError(errs);
		}
		const job = await Job.update(req.params.id, req.body);
		return res.json({ job });
	} catch (error) {
		return next(error);
	}
});
/**
 * DELETE / [id] - DELETE A JOB
 * 
 * Authorization required: admin
 */

router.delete('/:id', ensureAdmin, async (req, res, next) => {
	try {
		await Job.remove(req.params.id);
		const id = +req.params.id;
		return res.json({ deleted: id });
	} catch (error) {
		return next(error);
	}
});
module.exports = router;
