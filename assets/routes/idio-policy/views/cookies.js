const keystone = require('keystone');
const fs = require('fs');
const path = require('path');

const config = require('idio-keystone-utils').plugins.properties('idio-policy');

module.exports = function (req, res) {

	const view = new keystone.View(req, res);
	let locals = res.locals;
	
	locals.cookiecoffeeID = config.cookieCoffee.id;
	view.render('idio-policy/cookie');
	
}