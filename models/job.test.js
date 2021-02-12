'use strict';

const { NotFoundError, BadRequestError, UnauthorizedError } = require('../expressError');
const db = require('../db');
const Job = require('./job');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, testJobsIds } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
describe('create a job', () => {
	test('should create a job', async () => {
		const jobPost = { companyHandle: 'c1', title: 'new', salary: 1000, equity: '0.1' };
		const job = await Job.create(jobPost);
		expect(job).toEqual({ ...jobPost, id: expect.any(Number) });
	});
});

/************************************** find all */
describe('find all jobs', () => {
	test('should find all jobs', async () => {
		const jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'job0',
				salary        : 100,
				equity        : '0.1',
				companyHandle : 'c1',
				companyName   : 'C1'
			},
			{
				id            : expect.any(Number),
				title         : 'job1',
				salary        : 1000,
				equity        : '0.2',
				companyHandle : 'c1',
				companyName   : 'C1'
			},
			{
				id            : expect.any(Number),
				title         : 'job2',
				salary        : 10000,
				equity        : null,
				companyHandle : 'c1',
				companyName   : 'C1'
			}
		]);
	});
	test('should work by filtering by salary', async () => {
		const jobs = await Job.findAll({ minSalary: 999 });
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'job1',
				salary        : 1000,
				equity        : '0.2',
				companyHandle : 'c1',
				companyName   : 'C1'
			},
			{
				id            : expect.any(Number),
				title         : 'job2',
				salary        : 10000,
				equity        : null,
				companyHandle : 'c1',
				companyName   : 'C1'
			}
		]);
	});
	test('should work by filtering by name', async () => {
		const jobs = await Job.findAll({ title: 'job1' });
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'job1',
				salary        : 1000,
				equity        : '0.2',
				companyHandle : 'c1',
				companyName   : 'C1'
			}
		]);
	});
	test('should work by filtering by equity', async () => {
		const jobs = await Job.findAll({ hasEquity: true });
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'job0',
				salary        : 100,
				equity        : '0.1',
				companyHandle : 'c1',
				companyName   : 'C1'
			},
			{
				id            : expect.any(Number),
				title         : 'job1',
				salary        : 1000,
				equity        : '0.2',
				companyHandle : 'c1',
				companyName   : 'C1'
			}
		]);
	});
	test('should work by filtering by multiple params', async () => {
		const jobs = await Job.findAll({ hasEquity: true, title: 'job1' });
		expect(jobs).toEqual([
			{
				id            : expect.any(Number),
				title         : 'job1',
				salary        : 1000,
				equity        : '0.2',
				companyHandle : 'c1',
				companyName   : 'C1'
			}
		]);
	});
});

/************************************** get */
describe('get a single job', () => {
	test('should work by id ', async () => {
		const job = await Job.get(testJobsIds[0]);
		expect(job).toEqual({
			id            : expect.any(Number),
			title         : 'job0',
			salary        : 100,
			equity        : '0.1',
			companyHandle : 'c1',
			company       : {
				name          : 'C1',
				description   : 'Desc1',
				num_employees : 1,
				logo_url      : 'http://c1.img'
			}
		});
	});
	test('should not work with bad id ', async () => {
		try {
			await Job.get(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */
describe('update a job', () => {
	test('should work with valid id', async () => {
		const job = await Job.update(testJobsIds[0], { title: 'newData' });
		expect(job).toEqual({
			id            : testJobsIds[0],
			title         : 'newData',
			salary        : 100,
			equity        : '0.1',
			companyHandle : 'c1'
		});
	});
	test('should not work with bad id', async () => {
		try {
			await Job.update(0, {
				title : 'newData'
			});
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
	test('should not work with bad data ', async () => {
		try {
			await Job.update(testJobsIds[0], {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */
describe('remove a job', () => {
	test('should delete', async () => {
		await Job.remove(testJobsIds[0]);
		const res = await db.query('SELECT id FROM jobs WHERE id=$1', [ testJobsIds[0] ]);
		expect(res.rows.length).toEqual(0);
	});
	test('should throw error if no job', async () => {
		try {
			await Job.remove(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
