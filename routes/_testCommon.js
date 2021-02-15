'use strict';

const db = require('../db.js');
const User = require('../models/user');
const Company = require('../models/company');
const Job = require('../models/job');
const { createToken } = require('../helpers/tokens');
const testJobsIds = [];
async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM users');
	// noinspection SqlWithoutWhere
	await db.query('DELETE FROM companies');

	await Company.create({
		handle       : 'c1',
		name         : 'C1',
		numEmployees : 1,
		description  : 'Desc1',
		logoUrl      : 'http://c1.img'
	});
	await Company.create({
		handle       : 'c2',
		name         : 'C2',
		numEmployees : 2,
		description  : 'Desc2',
		logoUrl      : 'http://c2.img'
	});
	await Company.create({
		handle       : 'c3',
		name         : 'C3',
		numEmployees : 3,
		description  : 'Desc3',
		logoUrl      : 'http://c3.img'
	});

	await User.register({
		username  : 'u1',
		firstName : 'U1F',
		lastName  : 'U1L',
		email     : 'user1@user.com',
		password  : 'password1',
		isAdmin   : false
	});
	await User.register({
		username  : 'u2',
		firstName : 'U2F',
		lastName  : 'U2L',
		email     : 'user2@user.com',
		password  : 'password2',
		isAdmin   : false
	});
	await User.register({
		username  : 'u3',
		firstName : 'U3F',
		lastName  : 'U3L',
		email     : 'user3@user.com',
		password  : 'password3',
		isAdmin   : false
	});
	const job0 = await Job.create({ title: 'job0', salary: 100, equity: '0.1', companyHandle: 'c1' });
	testJobsIds.push(job0.id);
	const job1 = await Job.create({ title: 'job1', salary: 1000, equity: '0.2', companyHandle: 'c1' });
	testJobsIds.push(job1.id);
	const job2 = await Job.create({ title: 'job2', salary: 10000, companyHandle: 'c1' });
	testJobsIds.push(job2.id);

	await User.applyToJob('u1', testJobsIds[0]);
}

async function commonBeforeEach() {
	await db.query('BEGIN');
}

async function commonAfterEach() {
	await db.query('ROLLBACK');
}

async function commonAfterAll() {
	await db.end();
}

const u1Token = createToken({ username: 'u1', isAdmin: false });
const u2Token = createToken({ username: 'u2', isAdmin: false });
const adminToken = createToken({ username: 'admin', isAdmin: true });

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	adminToken,
	u2Token,
	testJobsIds
};
