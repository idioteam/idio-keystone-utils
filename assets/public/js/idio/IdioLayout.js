/**
 * IdioLayout
 * @constructor
 * =============
 * IdioLayout emette un evento personalizzato allo scattare del document ready e del window resize.
 * Il nome dell'evento emesso varia a seconda della dimensione del viewport ed è basato sui break point di Bootstrap (layout-xs, layout-sm, layout-md, layout-lg).
 * Associato all'evento viene passato l'oggetto data che riporta dati aggiuntivi vedi commenti su this.data
 * esempio di gestione dell'evento emesso:
 *
	$(document).on('layout-md layout-lg', function(e, vp) {
		if (origine && origine.length) {
			a = a || new Animazione();
			a.run('o1', origine);
		}
	})

 * Note:
 * =====
 * l'evento viene sempre emesso su $(document)
 * è possibile collegare un gestore a più eventi passando come primo parametro l'elenco degli eventi separati da spazi
 * la callback accetta due parametri:
 * - e rappresenta l'evento
 * - vp rappresenta i paramtri passati dall'evento
});
 */

(function IdioLayout(){

	var _this = this,
		resizeId = null;

    //  questo oggetto viene passato come parametro quando viene emesso l'evento
	this.data = {
		documentReady:false,    //  true se l'evento document ready è già scattato
		windowLoad: false,      //  true se l'evento windowLoad è già scattato
		size: null,             //  riporta la dimensione del layout (xs,sm,md.lg)
		vp: 0                   //  viewport width
	};

    //  valuta layout
	this.eval = function(){

		_this.data.vp = $(window).width();
		var breakpoints = [480,768,992,1200];

		if( _this.data.vp <= 768 ){
			_this.data.size = 'xs';
		}
		if( _this.data.vp > 768 && _this.data.vp <= 992 ){
			_this.data.size = 'sm';
		}
		if( _this.data.vp > 992 && _this.data.vp <= 1200 ){
			_this.data.size = 'md';
		}
		if( _this.data.vp > 1200 ){
			_this.data.size = 'lg';
		}

		$(document).trigger('layout-' + _this.data.size, [_this.data]);

	};

    //-----------------------------------------//
    //  Eventi globali
    //-----------------------------------------//

	//	Document ready
	$(document).ready(function(){

		_this.data.documentReady = true;
		_this.eval();

	});

	//	Window load
	$(window).load(function(){

		_this.data.windowLoad = true;

	});

	//	Window resize
	$(window).resize(function(){
		clearTimeout(resizeId);
		resizeId = setTimeout(_this.eval, 300);
	});

}());
