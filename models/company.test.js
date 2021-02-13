'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Company = require('./company.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function() {
	const newCompany = {
		handle       : 'new',
		name         : 'New',
		description  : 'New Description',
		numEmployees : 1,
		logoUrl      : 'http://new.img'
	};

	test('works', async function() {
		let company = await Company.create(newCompany);
		expect(company).toEqual(newCompany);

		const result = await db.query(
			`SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'new'`
		);
		expect(result.rows).toEqual([
			{
				handle        : 'new',
				name          : 'New',
				description   : 'New Description',
				num_employees : 1,
				logo_url      : 'http://new.img'
			}
		]);
	});

	test('bad request with dupe', async function() {
		try {
			await Company.create(newCompany);
			await Company.create(newCompany);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** findAll */

describe('findAll', function() {
	test('works: no filter', async function() {
		let companies = await Company.findAll();
		expect(companies).toEqual([
			{
				handle       : 'c1',
				name         : 'C1',
				description  : 'Desc1',
				numEmployees : 1,
				logoUrl      : 'http://c1.img'
			},
			{
				handle       : 'c2',
				name         : 'C2',
				description  : 'Desc2',
				numEmployees : 2,
				logoUrl      : 'http://c2.img'
			},
			{
				handle       : 'c3',
				name         : 'C3',
				description  : 'Desc3',
				numEmployees : 3,
				logoUrl      : 'http://c3.img'
			}
		]);
	});

	test('should not filter anything if empty object is passed in', async () => {
		const empty = {};
		const companies = await Company.findAll(empty);
		expect(companies).toEqual([
			{
				handle       : 'c1',
				name         : 'C1',
				description  : 'Desc1',
				numEmployees : 1,
				logoUrl      : 'http://c1.img'
			},
			{
				handle       : 'c2',
				name         : 'C2',
				description  : 'Desc2',
				numEmployees : 2,
				logoUrl      : 'http://c2.img'
			},
			{
				handle       : 'c3',
				name         : 'C3',
				description  : 'Desc3',
				numEmployees : 3,
				logoUrl      : 'http://c3.img'
			}
		]);
	});

	test('should be able to search by name, case insensitive', async () => {
		const data = { name: 'c' };
		const companies = await Company.findAll(data);
		expect(companies).toEqual([
			{
				handle       : 'c1',
				name         : 'C1',
				description  : 'Desc1',
				numEmployees : 1,
				logoUrl      : 'http://c1.img'
			},
			{
				handle       : 'c2',
				name         : 'C2',
				description  : 'Desc2',
				numEmployees : 2,
				logoUrl      : 'http://c2.img'
			},
			{
				handle       : 'c3',
				name         : 'C3',
				description  : 'Desc3',
				numEmployees : 3,
				logoUrl      : 'http://c3.img'
			}
		]);
	});

	test('should be able to search by name if the parameter includes only a part of the name', async () => {
		const data = { name: '1' };
		const companies = await Company.findAll(data);
		expect(companies).toEqual([
			{
				handle       : 'c1',
				name         : 'C1',
				description  : 'Desc1',
				numEmployees : 1,
				logoUrl      : 'http://c1.img'
			}
		]);
	});

	test('should be able to search by two different parameters', async () => {
		const data = { minEmployees: '2', name: '3' };
		const companies = await Company.findAll(data);
		expect(companies).toEqual([
			{
				handle       : 'c3',
				name         : 'C3',
				description  : 'Desc3',
				numEmployees : 3,
				logoUrl      : 'http://c3.img'
			}
		]);
	});

	test('should be able to return empty array', async () => {
		const data = { minEmployees: '1000' };
		const companies = await Company.findAll(data);
		expect(companies.length).toBe(0);
	});
	test('should return an empty array of companies, when nothing matches search params', async () => {
		const data = { minEmployees: '10' };
		const companies = await Company.findAll(data);
		expect(companies.length).toBe(0);
	});
	test('should throw error if bad data: min> max', async () => {
		try {
			const data = { minEmployees: 3, maxEmployees: 1 };
			await Company.findAll(data);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** get */

describe('get', function() {
	test('works', async function() {
		let company = await Company.get('c1');
		expect(company).toEqual({
			handle       : 'c1',
			name         : 'C1',
			description  : 'Desc1',
			numEmployees : 1,
			logoUrl      : 'http://c1.img'
		});
	});

	test('not found if no such company', async function() {
		try {
			await Company.get('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe('update', function() {
	const updateData = {
		name         : 'New',
		description  : 'New Description',
		numEmployees : 10,
		logoUrl      : 'http://new.img'
	};

	test('works', async function() {
		let company = await Company.update('c1', updateData);
		expect(company).toEqual({
			handle : 'c1',
			...updateData
		});

		const result = await db.query(
			`SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`
		);
		expect(result.rows).toEqual([
			{
				handle        : 'c1',
				name          : 'New',
				description   : 'New Description',
				num_employees : 10,
				logo_url      : 'http://new.img'
			}
		]);
	});

	test('works: null fields', async function() {
		const updateDataSetNulls = {
			name         : 'New',
			description  : 'New Description',
			numEmployees : null,
			logoUrl      : null
		};

		let company = await Company.update('c1', updateDataSetNulls);
		expect(company).toEqual({
			handle : 'c1',
			...updateDataSetNulls
		});

		const result = await db.query(
			`SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`
		);
		expect(result.rows).toEqual([
			{
				handle        : 'c1',
				name          : 'New',
				description   : 'New Description',
				num_employees : null,
				logo_url      : null
			}
		]);
	});

	test('not found if no such company', async function() {
		try {
			await Company.update('nope', updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request with no data', async function() {
		try {
			await Company.update('c1', {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe('remove', function() {
	test('works', async function() {
		await Company.remove('c1');
		const res = await db.query("SELECT handle FROM companies WHERE handle='c1'");
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such company', async function() {
		try {
			await Company.remove('nope');
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
