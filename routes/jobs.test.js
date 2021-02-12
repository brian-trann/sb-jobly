'use strict';

const request = require('supertest');

const app = require('../app');

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	adminToken,
	testJobsIds
} = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */
describe('POST /jobs', () => {
	test('post OK for admin', async () => {
		const res = await request(app)
			.post('/jobs')
			.send({ companyHandle: 'c1', title: 'newJob', salary: 100, equity: '0.1' })
			.set('authorization', `Bearer ${adminToken}`);
		expect(res.statusCode).toEqual(201);
		expect(res.body).toEqual({
			job : {
				id            : expect.any(Number),
				companyHandle : 'c1',
				title         : 'newJob',
				salary        : 100,
				equity        : '0.1'
			}
		});
	});
	test('unauthorized for user', async () => {
		const res = await request(app)
			.post('/jobs')
			.send({ companyHandle: 'c1', title: 'newJob', salary: 100, equity: '0.1' })
			.set('authorization', `Bearer ${u1Token}`);
		expect(res.statusCode).toEqual(401);
	});
	test('unauthorized for anon', async () => {
		const res = await request(app)
			.post('/jobs')
			.send({ companyHandle: 'c1', title: 'newJob', salary: 100, equity: '0.1' });
		expect(res.statusCode).toEqual(401);
	});
	test('bad request - 400 with missing data', async () => {
		const res = await request(app)
			.post('/jobs')
			.send({ title: 'newJob', salary: 100, equity: '0.1' })
			.set('authorization', `Bearer ${adminToken}`);
		expect(res.statusCode).toEqual(400);
	});
	test('bad request with invalid data', async () => {
		const res = await request(app)
			.post('/jobs')
			.send({ companyHandle: 'c1', title: 'newJob', salary: 'intern', equity: '0.1' })
			.set('authorization', `Bearer ${adminToken}`);
		expect(res.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */
describe('GET /jobs', () => {
	test('ok for anon', async () => {
		const res = await request(app).get('/jobs');
		expect(res.body).toEqual({
			jobs : [
				{
					id            : testJobsIds[0],
					title         : 'job0',
					salary        : 100,
					equity        : '0.1',
					companyHandle : 'c1',
					companyName   : 'C1'
				},
				{
					id            : testJobsIds[1],
					title         : 'job1',
					salary        : 1000,
					equity        : '0.2',
					companyHandle : 'c1',
					companyName   : 'C1'
				},
				{
					id            : testJobsIds[2],
					title         : 'job2',
					salary        : 10000,
					equity        : null,
					companyHandle : 'c1',
					companyName   : 'C1'
				}
			]
		});
	});

	test('ok for anon w/ filter', async () => {
		const res = await request(app).get('/jobs').query({ title: 'job1' });
		expect(res.body).toEqual({
			jobs : [
				{
					id            : testJobsIds[1],
					title         : 'job1',
					salary        : 1000,
					equity        : '0.2',
					companyHandle : 'c1',
					companyName   : 'C1'
				}
			]
		});
	});
	test('ok for anon w/ filters', async () => {
		const res = await request(app).get('/jobs').query({ title: 'job', minSalary: 999 });
		expect(res.body).toEqual({
			jobs : [
				{
					id            : testJobsIds[1],
					title         : 'job1',
					salary        : 1000,
					equity        : '0.2',
					companyHandle : 'c1',
					companyName   : 'C1'
				},
				{
					id            : testJobsIds[2],
					title         : 'job2',
					salary        : 10000,
					equity        : null,
					companyHandle : 'c1',
					companyName   : 'C1'
				}
			]
		});
	});
	test('bad request with invalid filter key', async () => {
		const res = await request(app).get('/jobs').query({ intern: 'intern', minSalary: 999 });
		expect(res.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs/:id */
describe('GET /jobs/:id', () => {
	//
	test('ok for anon', async () => {
		const res = await request(app).get(`/jobs/${testJobsIds[0]}`);
		expect(res.body).toEqual({
			job : {
				id            : testJobsIds[0],
				title         : 'job0',
				salary        : 100,
				equity        : '0.1',
				companyHandle : 'c1',
				company       : {
					description   : 'Desc1',
					logo_url      : 'http://c1.img',
					name          : 'C1',
					num_employees : 1
				}
			}
		});
	});

	test('job not found', async () => {
		const res = await request(app).get(`/jobs/0`);
		expect(res.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs /:id */
describe('PATCH /jobs/:id', () => {
	test('patch OK for admin', async () => {
		const res = await request(app)
			.patch(`/jobs/${testJobsIds[0]}`)
			.send({ title: 'newTitle' })
			.set('authorization', `Bearer ${adminToken}`);
		expect(res.body).toEqual({
			job : { id: testJobsIds[0], title: 'newTitle', salary: 100, equity: '0.1', companyHandle: 'c1' }
		});
	});
	test('unauthorized for user', async () => {
		const res = await request(app)
			.patch(`/jobs/${testJobsIds[0]}`)
			.send({ title: 'newTitle' })
			.set('authorization', `Bearer ${u1Token}`);
		expect(res.statusCode).toEqual(401);
	});
	test('unauthorized for anon', async () => {
		const res = await request(app).patch(`/jobs/${testJobsIds[0]}`).send({ title: 'newTitle' });
		expect(res.statusCode).toEqual(401);
	});
	test('bad request - bad ID', async () => {
		const res = await request(app)
			.patch('/jobs/0')
			.send({ title: 'newTitle' })
			.set('authorization', `Bearer ${adminToken}`);
		expect(res.statusCode).toEqual(404);
	});
	test('bad request with invalid data', async () => {
		const res = await request(app)
			.patch('/jobs/0')
			.send({ intern: 'intern' })
			.set('authorization', `Bearer ${adminToken}`);
		expect(res.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:id */
describe('DELETE /jobs/:id', () => {
	test('delete OK for admin', async () => {
		const res = await request(app).delete(`/jobs/${testJobsIds[0]}`).set('authorization', `Bearer ${adminToken}`);
		expect(res.body).toEqual({ deleted: testJobsIds[0] });
	});
	test('unauthorized for user', async () => {
		const res = await request(app).delete(`/jobs/${testJobsIds[0]}`).set('authorization', `Bearer ${u1Token}`);
		expect(res.statusCode).toEqual(401);
	});
	test('unauthorized for anon', async () => {
		const res = await request(app).delete(`/jobs/${testJobsIds[0]}`);
		expect(res.statusCode).toEqual(401);
	});
	test('job not found - 400 as admin', async () => {
		const res = await request(app).delete('/jobs/0').set('authorization', `Bearer ${adminToken}`);
		expect(res.statusCode).toEqual(404);
	});
});
