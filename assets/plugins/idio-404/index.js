/**
 * idio-404
 * Created by m.pini on 02/08/2017.
 *
 * gestione errori 404
 *
 */

//	Exports
//	=======
module.exports.registra = registraPlugin;
module.exports.middleware = setMiddleware;


const nomePlugin = 'idio-404';
const pathRoutes = '../../routes';

function registraPlugin () {

	const props = {};
	props[nomePlugin] = {

	};

	return props;

}

function setMiddleware () {

	require(pathRoutes + '/' + nomePlugin + '/middleware');

}
