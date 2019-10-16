/**
 * IdioModale
 * @param cnf
 * @constructor
 * ============
 * Gestisce una modale.
 * L'oggetto cnf contiene le configurazioni (vedi commenti sotto)
 */
function IdioModale(cnf){
	
	var _this = this,
		conf = $.extend(true,{
            //  header: se true inserisce l'header nella modale
			header: true,
            //  pulsanteChiusuraHeader: se true inserisce il pulsante di chiusura nell'header
			pulsanteChiusuraHeader: true,
            //  chiusuraHeader: codice del pulsante di chiusura dell'header
			chiusuraHeader: '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
								'<span aria-hidden="true">&times;</span>' +
							'</button>',
            //  footer: se true inserisce il footer nella modale
			footer: true,
            //  pulsanteChiusuraFooter: se true inserisce il pulsante di chiusura nel footer
			pulsanteChiusuraFooter: true,
            //  chiusuraFooter: codice del pulsante di chiusura del footer
			chiusuraFooter: '<button type="button" class="btn btn-default" data-dismiss="modal">Chiudi</button>',
            //  large: se true visualizza la modale in modalità large
			large: true,
            //  id: id della modale
			id: 'modale',
            //  opzioni: opzioni della modale come da bootstrap
			opzioni :{
				backdrop: true,
				keyboard: true,
				show: true
			}
		},cnf),
		_modale,
		_modaleHeader,
		_modaleBody,
		_modaleFooter,
		layoutHeader,
		layoutFooter;
	/**
     * layoutHeader
	 * @returns {String}
     * =================
     * Inserisce l'header se conf.header è true
     * Inserisce il pulsante di chiusura se conf.pulsanteChiusuraHeader è true
     */
	layoutHeader = function(){
		
		if( !conf.header ){
			return '';
		}
		
		return '<div class="modal-header">' +
			( conf.pulsanteChiusuraHeader ? conf.chiusuraHeader : '' ) +
			'<h2 class="modal-title"></h2>' +
		'</div>'
		
	};
	/**
     * layoutFooter
	 * @returns {String}
     * =================
     * Inserisce il footer se conf.footer è true
     * Inserisce il pulsante di chiusura se conf.pulsanteChiusuraFooter è true
     */
	layoutFooter = function(){

		if( !conf.footer ){
			return '';
		}
		
		return '<div class="modal-footer">' +
			( conf.pulsanteChiusuraFooter ? conf.chiusuraFooter : ''	) +
		'</div>'
		
	};
	//-----------------------------------------//
	//  metodi pubblici
	//-----------------------------------------//
	/**
     * crea
	 * @param id
	 * @returns {jQuery|HTMLElement}
     * =============================
     * Appende la modale al body e la ritorna
     */
	this.crea = function(id){
		
		var modale = 
			'<div class="modal fade" id="' + id + '">' +
				'<div class="modal-dialog ' + (conf.large ? 'modal-lg' : '') +'">' +
					'<div class="modal-content">' +
						layoutHeader() +
						'<div class="modal-body"></div>' +
						layoutFooter() +
					'</div>' +
				'</div>' +
			'</div>';
		
		$('body').append(modale);
		return $('#'+id);
	};
	/**
     * setHeader
	 * @param header
     * @returns {IdioModale}
     * =============
     * Imposta il titolo della modale
     */
	this.setHeader = function(header){
		_modaleHeader.html(header);
		return _this;
	};
	/**
     * resetFooter
     * ===========
	 * Svuota il footer reinserendo il pulsante di chiusura se configurato
     */
	this.resetFooter = function(){
		_modaleFooter.html( pulsanteChiusuraFooter ? conf.chiusuraFooter : '');
	};
	/**
	 * setFooter
	 * @param footer
     * @returns {IdioModale}
     * =============
     * Appende un elemento al footer
     */
	this.setFooter = function(footer){
		_modaleFooter.append(footer);
		return _this;
	};
	/**
     * setBody
	 * @param body
     * @returns {IdioModale}
     * ======================
     * Imposta il contenuto del body
     */
	this.setBody = function(body){
		_modaleBody.html(body);
		return _this;
	};
    /**
     * set
     * @param header
     * @param body
     * @param footer
     * @param resetFooter
     * @returns {IdioModale}
     * =====================
     * Imposta header, body, footer
     */
	this.set = function(header, body, footer, resetFooter){
		
		if(resetFooter){
			_this.resetFooter();
		}
		_this.setHeader(header).setBody(body).setFooter(footer);
		return _this;
		
	};
	/**
     * modal
	 * @param o
     * ========
     * Consente di richiamare il metodo modal
     * passando nel parametro o comandi o configurazioni
     */
	this.modal = function(o){
		_modale.modal( o ? o : conf.opzioni);
	};
	/**
     * get
	 * @returns {jQuery|HTMLElement|*}
     * ===============================
     * Ritorna l'oggetto modale.Utile per aggiungere eventi
     */
	this.get = function(){
		return _modale;
	};
    //-----------------------------------------//
    //  Creazione della modale e caching
    //-----------------------------------------//
	_modale = _this.crea(conf.id);
	_modaleHeader = _modale.find('.modal-title');
	_modaleBody = _modale.find('.modal-body');
	_modaleFooter = _modale.find('.modal-footer');
	
}
