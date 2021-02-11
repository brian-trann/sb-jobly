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

	test('should return an empty array of companies, when nothing matches search params', async () => {
		const data = { minEmployees: '10' };
		const companies = await Company.findAll(data);
		expect(companies.length).toBe(0);
	});
});

/************************************** dataToFilterBy */
describe('dataToFilterBy', () => {
	test('should throw BadRequestError if a key in the data object is not allowed', () => {
		const notAllowedObj = { notAllowed: 'no' };
		expect(() => {
			Company.dataToFilterBy(notAllowedObj);
		}).toThrowError(new BadRequestError('A search parameter was not allowed'));
	});

	test('should throw BadRequestError if minEmployees > maxEmployees', () => {
		const minMaxObj = { minEmployees: '3', maxEmployees: '0' };
		expect(() => {
			Company.dataToFilterBy(minMaxObj);
		}).toThrowError(BadRequestError);
	});

	test('should throw BadRequestError if minEmployees < 0', () => {
		const negative = { minEmployees: '-1' };
		expect(() => {
			Company.dataToFilterBy(negative);
		}).toThrowError(BadRequestError);
	});

	test('should be able choose different allowed filtering parameters', () => {
		const data = { minEmployees: '2' };
		const onlyMaxAllowed = [ 'maxEmployees' ];
		expect(() => {
			Company.dataToFilterBy(data, onlyMaxAllowed);
		}).toThrowError(BadRequestError);
	});

	test('should throw error if any value in object is empty', () => {
		const data = { minEmployees: '2', name: '' };
		expect(() => {
			Company.dataToFilterBy(data);
		}).toThrowError(new BadRequestError('Search parameters can not be empty'));
	});

	test('should throw error if minEmployee || maxEmployee value is NaN', () => {
		const minData = { minEmployee: 'a', maxEmployee: '1' };
		const maxData = { maxEmployee: 'a', minEmployee: '1' };
		expect(() => {
			Company.dataToFilterBy(minData);
		}).toThrowError(BadRequestError);
		expect(() => {
			Company.dataToFilterBy(maxData);
		}).toThrowError(BadRequestError);
	});

	test('should generate the same number of elements in paramValues as the values in data, given valid data', () => {
		const data = { minEmployees: '2' };
		const res = Company.dataToFilterBy(data);
		expect(res.paramValues.length).toBe(Object.values(data).length);
	});

	test('should generate a part of a WHERE SQL condition, given a single filtering param; should not include "AND"', () => {
		const data = { minEmployees: '2' };
		const res = Company.dataToFilterBy(data);
		expect(res.whereClause.includes(' AND ')).toBeFalsy();
	});

	test('should generate a part of a WHERE SQL condition, given multiple filtering params', () => {
		const data = { minEmployees: '1', maxEmployees: '3' };
		const res = Company.dataToFilterBy(data);
		expect(res.whereClause.includes(' AND ')).toBeTruthy();
	});

	test('should have same number of whereClauses, when split on AND, as paramValues', () => {
		const data = { minEmployees: '1', maxEmployees: '3' };
		const res = Company.dataToFilterBy(data);
		expect(res.paramValues.length).toBe(res.whereClause.split('AND').length);
	});
});

/************************************** validateData */
describe('validateData', () => {
	const allowed = [ 'name', 'minEmployees', 'maxEmployees' ];

	test('should return valid object with no errors in , given valid data', () => {
		const data = { minEmployees: '1', maxEmployees: '3', name: 'c' };
		const res = Company.validateData(data, allowed);
		expect(res.valid).toBeTruthy();
		expect(res.error).toBe('');
	});
	test('should return valid object with no errors in , given valid data: only one property', () => {
		const data = { minEmployees: '1' };
		const res = Company.validateData(data, allowed);
		expect(res.valid).toBeTruthy();
		expect(res.error).toBe('');
	});
	test('should return invalid object if a data property is not allowed', () => {
		const nameOnly = [ 'name' ];
		const data = { minEmployees: '1', maxEmployees: '3', name: 'c' };
		const res = Company.validateData(data, nameOnly);
		expect(res.valid).toBeFalsy();
		expect(res.error).toBe('A search parameter was not allowed');
	});
	test('should return invalid object if a single data value was empty', () => {
		const data = { minEmployees: '1', maxEmployees: '3', name: '' };
		const res = Company.validateData(data, allowed);
		expect(res.valid).toBeFalsy();
		expect(res.error).toBe('Search parameters can not be empty');
	});
	test('should return invalid object if a number was not used for min/max employee', () => {
		const data = { minEmployees: '1', maxEmployees: 'a' };
		const res = Company.validateData(data, allowed);
		expect(res.valid).toBeFalsy();
		expect(res.error).toBe('Integers are only allowed');
	});
	test('should return invalid if evaluated minEmployee > maxEmployee', () => {
		const data = { minEmployees: '3', maxEmployees: '1' };
		const res = Company.validateData(data, allowed);
		expect(res.valid).toBeFalsy();
		expect(res.error).toBe(
			`minEmployees(${data.minEmployees}) can not be greather than maxEmployees(${data.maxEmployees})`
		);
	});
	test('should return invalid if evaluated minEmployee < 0', () => {
		const data = { minEmployees: '-1' };
		const res = Company.validateData(data, allowed);
		expect(res.valid).toBeFalsy();
		expect(res.error).toBe('Minimum employees can not be negative');
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
