/**
 * idio-404
 * Created by m.pini on 02/08/2017.
 *
 * gestione errori 404
 * middleware
 *
 */
const keystone = require('keystone');
keystone.pre('routes', initErrorHandlers);

//	Cattura tutte le routes non esistenti
keystone.set('404', function (req, res, next) {
	res.notfound();
});
/**
 * Aggiunge il metodo notfound alla response
 * Il metodo redirige alla pagina di gestione degli errori 404
 *
 * @param req
 * @param res
 * @param next
 */
function initErrorHandlers (req, res, next) {

	res.notfound = function (title, message) {
		res.status(404).render('errors/404', {
			errorTitle: title,
			errorMsg: message,
		});
	};

	next();

}
