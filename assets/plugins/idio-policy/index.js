/**
 * idio-policy
 * Created by m.pini on 02/08/2017.
 *
 * gestione privacy policy e cookie policy
 *
 */

//	Exports
//	=======
module.exports.registra = registraPlugin;
module.exports.routes = setRoutes;

const config = require('./config');
const keystone = require('keystone');
const nomePlugin = 'idio-policy';
const pathRoutes = '../../routes';

function registraPlugin () {

	const props = {};
	props[nomePlugin] = config;

	return props;

}

function setRoutes (app, path) {

	let importRoutes = keystone.importer(path);
	let routes = {
		views: importRoutes('./views'),
	};
	//	Privacy policy
	app.get(config.routes.privacy, routes.views.privacy);

	//	Cookie policy
	app.get(config.routes.cookies, routes.views.cookies);

}
