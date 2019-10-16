/**
 * Created by Mat on 25/07/2016.
 */
var keystone = require('keystone');

exports = module.exports = function(app, cookieRoute, privacyRoute){

    var importRoutes = keystone.importer(__dirname),
        routes = {
            views: importRoutes('../../../routes/views')
        };

    //  Cookie policy
    app.get( cookieRoute || '/cookie-policy', routes.views['idio-policy'].cookies);

    //  Privacy policy
    app.get( privacyRoute || '/privacy-policy', routes.views['idio-policy'].privacy);

};