'use strict';

const { BadRequestError } = require('../expressError');
const { sqlForPartialUpdate } = require('./sql');

let jsToSql;

beforeEach(() => {
	jsToSql = {
		firstName : 'first_name',
		lastName  : 'last_name',
		isAdmin   : 'is_admin'
	};
});
/*************************************** Tests for sql.js  */

describe('Unit tests for sqlForPartialUpdate', () => {
	test('should throw BadRequestError if dataToUpdate has no keys', () => {
		const empty = {};
		expect(() => {
			sqlForPartialUpdate(empty, jsToSql);
		}).toThrowError(new BadRequestError('No data'));
	});

	test('values should be an array, equal to the amount of keys in dataToUpdate', () => {
		const dataToUpdate = {
			firstName : 'newFirst',
			lastName  : 'newLast'
		};
		const res = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(res.values.length).toBe(Object.values(dataToUpdate).length);
	});

	test('should format JS keys for SQL statement to match column names, if key is in jsToSql', () => {
		const dataToUpdate = { firstName: 'newFirst' };
		const res = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(res.setCols).toBe(`"first_name"=$1`);
	});

	test('should format not format JS keys if not in jsToSql', () => {
		const dataToUpdate = { test: 'thisisatest' };
		const res = sqlForPartialUpdate(dataToUpdate, jsToSql);
		expect(res.setCols).toBe(`"test"=$1`);
	});

	test('should increment the parameterized (1 indexed), by one', () => {
		const dataToUpdate = { firstName: 'newFirst' };
		const dataToUpdateMultiple = { firstName: 'newFirst', lastName: 'newLast' };
		const res = sqlForPartialUpdate(dataToUpdate, jsToSql);
		const resMultiple = sqlForPartialUpdate(dataToUpdateMultiple, jsToSql);

		expect(res.setCols[res.setCols.length - 1]).toBe('1');
		expect(resMultiple.setCols[resMultiple.setCols.length - 1]).toBe('2');
	});

	test('should include the same values from dataToUpdate in the values property', () => {
		const dataToUpdateMultiple = { firstName: 'newFirst', lastName: 'newLast' };
		const values = Object.values(dataToUpdateMultiple);
		const res = sqlForPartialUpdate(dataToUpdateMultiple, jsToSql);
		expect(res.values).toEqual(values);
	});

	test('should concat multiple columns separated by a comma, given multiple k/v pairs in dataToUpdate', () => {
		const dataToUpdate = { firstName: 'newFirst', lastName: 'newLast' };
		const res = sqlForPartialUpdate(dataToUpdate, jsToSql);
		const resSetColsArray = res.setCols.split(', ');
		expect(resSetColsArray.length).toBe(Object.keys(dataToUpdate).length);
	});
});
