'use strict';

const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../expressError');
const { authenticateJWT, ensureLoggedIn, ensureAdmin, ensureAuthUserOrAdmin } = require('./auth');

const { SECRET_KEY } = require('../config');
const testJwt = jwt.sign({ username: 'test', isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: 'test', isAdmin: false }, 'wrong');

describe('authenticateJWT', function() {
	test('works: via header', function() {
		expect.assertions(2);
		const req = { headers: { authorization: `Bearer ${testJwt}` } };
		const res = { locals: {} };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({
			user : {
				iat      : expect.any(Number),
				username : 'test',
				isAdmin  : false
			}
		});
	});

	test('works: no header', function() {
		expect.assertions(2);
		const req = {};
		const res = { locals: {} };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});

	test('works: invalid token', function() {
		expect.assertions(2);
		const req = { headers: { authorization: `Bearer ${badJwt}` } };
		const res = { locals: {} };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		authenticateJWT(req, res, next);
		expect(res.locals).toEqual({});
	});
});

describe('ensureLoggedIn', function() {
	test('works', function() {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: 'test', isAdmin: false } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureLoggedIn(req, res, next);
	});

	test('unauth if no login', function() {
		expect.assertions(1);
		const req = {};
		const res = { locals: {} };
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureLoggedIn(req, res, next);
	});
});

describe('ensureAdmin', () => {
	test('is an admin works', () => {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: 'test', isAdmin: true } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureAdmin(req, res, next);
	});
	test('not an admin, throws error', () => {
		expect.assertions(1);
		const req = {};
		const res = { locals: { user: { username: 'test', isAdmin: false } } };
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureAdmin(req, res, next);
	});
	test('anon user throws error', () => {
		expect.assertions(1);
		const req = {};
		const res = { locals: {} };
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureAdmin(req, res, next);
	});
});

describe('ensureAuthUserOrAdmin', () => {
	test('should work for admin', () => {
		expect.assertions(1);
		const req = { params: { username: 'user' } };
		const res = { locals: { user: { username: 'admin', isAdmin: true } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureAuthUserOrAdmin(req, res, next);
	});
	test('should work for same user', () => {
		expect.assertions(1);

		const req = { params: { username: 'user' } };
		const res = { locals: { user: { username: 'user', isAdmin: false } } };
		const next = function(err) {
			expect(err).toBeFalsy();
		};
		ensureAuthUserOrAdmin(req, res, next);
	});
	test('should not work for different user', () => {
		expect.assertions(1);

		const req = { params: { username: 'user' } };
		const res = { locals: { user: { username: 'not-user', isAdmin: false } } };
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureAuthUserOrAdmin(req, res, next);
	});
	test('should not work for anon', () => {
		expect.assertions(1);

		const req = { params: { username: 'user' } };
		const res = { locals: {} };
		const next = function(err) {
			expect(err instanceof UnauthorizedError).toBeTruthy();
		};
		ensureAuthUserOrAdmin(req, res, next);
	});
});
