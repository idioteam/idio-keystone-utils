const keystone = require('keystone');
const fs = require('fs');
const path = require('path');


const config = require('idio-keystone-utils').plugins.properties('idio-policy');
let template = leggiTemplate();

module.exports = function (req, res) {

	const view = new keystone.View(req, res);
	const locals = res.locals;

	locals.informativa = {}
	
	var conf = keystone.get('idioDati');
	view.on('init', function(next){
		
		locals.informativa = compilaInformativa(
			template,
			{
                sito: conf.azienda.sito.nome,
                url: conf.azienda.sito.url,
                'trattamento-titolare': conf.privacy.trattamento.titolare || conf.azienda.nome,
                'trattamento-sede': conf.privacy.trattamento.sede || conf.azienda.indirizzo + ',' + conf.azienda.cap + ' - ' + conf.azienda.comune + ' ' + conf.azienda.provincia,
                'trattamento-telefono': conf.privacy.trattamento.telefono || conf.azienda.telefono,
                'trattamento-fax': conf.privacy.trattamento.fax || conf.azienda.fax,
                'trattamento-email': conf.privacy.trattamento.email || conf.azienda.email,
                'responsabile-email': conf.privacy.responsabile.email || conf.azienda.email,
                'cookies-pagina': conf.azienda.sito.url + conf.privacy.cookies.policyURL
            }
		);
		next();
		
	});

	view.render('idio-policy/privacy');

}

function leggiTemplate () {
	
	return fs.readFileSync( 'plugins' + config.templates.privacy ).toString();

}

function compilaInformativa(template, dati){
	
	return template
        .replace(/\{sito\}/gi, dati.sito)
        .replace(/\{url\}/gi, dati.url)
        .replace(/\{trattamento-titolare\}/gi, dati['trattamento-titolare'])
        .replace(/\{trattamento-sede\}/gi, dati['trattamento-sede'])
        .replace(/\{trattamento-telefono\}/gi, dati['trattamento-telefono'])
        .replace(/\{trattamento-fax\}/gi, dati['trattamento-fax'])
        .replace(/\{trattamento-email\}/gi, dati['trattamento-email'])
        .replace(/\{responsabile-email\}/gi, dati['responsabile-email'])
        .replace(/\{cookies-pagina\}/gi, dati['cookies-pagina']);
}