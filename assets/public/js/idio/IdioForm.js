/**
 * Created by Mat on 17/03/2016.
 */
/*
*	Argomenti:
* 	id: id del form - obbligatorio
* 	validazione: oggetto di funzioni di validazione, se passato viene unito a quelle di default
* 		validazioni di default:
* 		validate-email: valida un indirizzo email
* 		validate-integer: valida un valore intero
* 		validate-number: valida un numero (formato italiano)
* 		validate-string: valida	un valore di sole lettere inclusi segni diacritici
* 		validate-cf: valida un codice fiscale
* 		validate-equals: verfica che i campi abbiano lo stesso valore
* 		validate-select: verifica che non sia selezionata l'opzione vuota di un select (valore = #)	
* 	ajax: booleano - se true il form viene inviato via ajax
*  	idModale: stringa - nome della modale da inserire - default 'IdioFormModal'	
* 	success: oggetto - messaggio di successo. Può contenere le proprietà titolo, testo, classe, callback
* 	error: oggetto - messaggio di errore. Può contenere le proprietà titolo, testo, classe, callback
* */
function IdioForm(args){
	
	var me = this,
		pattern = /validate-[\d\w-]*/,
		elencoSubmit = [],
		id = args.id,
		form = $('#'+id),
		idModale = args.idModale || 'IdioFormModal',
		validazione = {

			'validate-email' : function(email) {
				console.log('email',email);
				var pattern = new RegExp('^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$');
				return pattern.test(email);
			},

			'validate-integer' : function(numero) {
				return !/[\D]/g.test(numero);
			},

			'validate-number': function(numero){
				numero = numero.replace('.','').replace(/,/g,'.');
				return !isNaN(numero);
			},

			'validate-string' : function(stringa) {
				return !/[^A-zÀ-ÿ ]/g.test(stringa);
			},

			'validate-cf' : function(cf) {

				var validi, i, s, set1, set2, setpari, setdisp;
				if (cf == '') {
					return false
				}
				cf = cf.toUpperCase();
				if (cf.length != 16) {
					return false;
				}
				validi = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
				for (i = 0; i < 16; i++) {
					if (validi.indexOf(cf.charAt(i)) == -1) {
						return false;
					}
				}
				set1 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
				set2 = "ABCDEFGHIJABCDEFGHIJKLMNOPQRSTUVWXYZ";
				setpari = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
				setdisp = "BAKPLCQDREVOSFTGUHMINJWZYX";
				s = 0;
				for (i = 1; i <= 13; i += 2){
					s += setpari.indexOf(set2.charAt(set1.indexOf(cf.charAt(i))));
				}
				for (i = 0; i <= 14; i += 2){
					s += setdisp.indexOf(set2.charAt(set1.indexOf(cf.charAt(i))));
				}
				if (s % 26 != cf.charCodeAt(15) - 'A'.charCodeAt(0)){
					return false;
				}
				return true;
			},

			'validate-equals': function(input){

				var isValid = true,
					veq = $('.validate-equals');
				veq.each( function(indice){

					if(indice > 0 && $(this).val() != '' ){
						isValid = isValid && ( $(this).val() == $('.validate-equals:eq('+(indice-1)+')').val() )
					}

				});
				if( isValid ){

					//$('.validate-equals ~ .errore').fadeOut();
					veq.removeClass('fieldError');
					$('.validate-equals ~ .errore').css('visibility','hidden');
					return true;

				}else{

					veq.addClass('fieldError');
					$('.validate-equals ~ .errore').css('visibility','visible');
					return false;

				}

			},

			'validate-select': function(input){

				return input != '#';

			}

		};
	
	var unisciOggetti = function(oggettoNativo, estensione){
		
		for(var key in estensione){
			if(estensione.hasOwnProperty(key)){
				oggettoNativo[key] = estensione[key];
			}
		}
		
		return oggettoNativo;
	};
	
	if( args.validazione ){
		
		validazione = unisciOggetti(validazione, args.validazione);
	}
	
	if( !id ){
		throw new Error('id form non definito');
	}
	
	if( form.length == 0){
		throw new Error('Form ' + id + ' non esistente');
	}

	var success = {
		classe: 'text-success',
		titolo: 'Form inviato',
		testo: 'Il form è stato inviato correttamente',
		callback: null
	};
	
	if( args.success ){
		success = unisciOggetti(success, args.success);
	}
	
	var error = {
		classe: 'text-danger',
		titolo: 'Impossibile inoltrare il form',
		testo: 'Alcuni campi obbligatori non sono stati compilati correttamente',
		callback: null
	};
	
	if( args.error ){
		error = unisciOggetti(error, args.error);
	}

	/*
	* 	Funzione principale
	* 	associa eventi al form ed ai suoi campi	
	* */
	this.processa = function(){

		$('#'+id+' :input').each( function(){
			//	Singolo campo
			var input = $(this);

			var classe = me.getValidationPattern(input);

			if (classe) {

				if (validazione[classe[0]] && typeof validazione[classe[0]] === "function") {

					//	Su blur
					input.bind('blur', {classe: classe, input: input}, function (event) {

						if (validazione[event.data.classe[0]](event.data.input.val()) && event.data.input.val() !== '') {

							me.nascondiErrore( me.getErrorField(event.data.input) )

						} else {
							console.log('event.data.input',event.data.input);
							me.mostraErrore( me.getErrorField(event.data.input) )
						}

					});

					//	Elenco validazioni per submit
					elencoSubmit.push({funzione: validazione[classe[0]], campo: input});

				}

			}else{

				//	non ha validazione, ma è comunque richiesto
				if( input.hasClass('required') ){

					if(input.attr('type')=='radio' || input.attr('type')=='checkbox') {

						input.bind('change blur', {classe: classe, input: input}, function (event) {
							
							if ( event.data.input.is(':checked') ) {
								me.nascondiErrore( me.getErrorField(event.data.input) )
							} else {
								me.mostraErrore( me.getErrorField(event.data.input) )
							}

						});

						//	Elenco validazioni per submit
						elencoSubmit.push({funzione: function(campo){
							return campo;
						}, campo: input});

					} else {

						input.bind('blur', {input: input}, function (event) {
		
							if (event.data.input.val() != '') {
								me.nascondiErrore( me.getErrorField(event.data.input) );
							} else
								me.mostraErrore( me.getErrorField(event.data.input) );
						});

						//	Elenco validazioni per submit
						elencoSubmit.push({funzione: function(campo){
							return campo != '';
						}, campo: input});

					}

				}

			}

		});

		form.submit( function(){
			return ( args.ajax ? false : me.validaForm() );
		});

		if( args.ajax ){

			form.keydown(function(event){
				if(event.keyCode == 13) {
					event.preventDefault();
					return false;
				}
			});

		}

	};

	this.getErrorField = function(input){
		return $('.errore[data-field="' + input.attr('id') + '"]');
	};

	this.mostraErrore = function( campo ){
		campo.css('visibility', 'visible');
	};

	this.nascondiErrore = function( campo ){
		campo.css('visibility', 'hidden');
	};

	this.getValidationPattern = function(input){
		return input.attr('class') ? input.attr('class').match( pattern ) : null;
	};

	this.validaForm = function(){

		var status = true;
		for(var i=0, l =elencoSubmit.length ; i<l; i++){
			var campo = elencoSubmit[i].campo;
			if( campo.is(':visible') && campo.is(':enabled') && campo.hasClass('required') ) {

				var check;

				if(campo.attr('type') == 'radio' || campo.attr('type') == 'checkbox') {

					check = ( elencoSubmit[i].funzione(campo.is(':checked')) );

				} else {

					check = (elencoSubmit[i].funzione(campo.val()) && campo.val() != '');

				}
				if(check){
					me.nascondiErrore( me.getErrorField(campo) )
				}else{
					me.mostraErrore( me.getErrorField(campo) )
				}

				status = status && check;
			}
		}

		//	Se status == false, notifico errori all'utente
		if( status == false ){

			me.mostraModale( 'text-danger' );
			if( error.callback && typeof error.callback === 'function' ){
				error.callback();
			}

		}else{
			if( success.callback && typeof success.callback === 'function' ){
				success.callback();
			}
		}

		return status;

	};
    /*
    * TODO: utilizzare IdioModale per tutta la gestione della modale.
    * */
	this.mostraModale = function(classe, titolo, testo){

		var modale = $('#' + idModale);

		if( modale.length == 0){
			modale = me.inserisciModale();
		}

		var messaggio = ( classe == success.classe ? success : error );

		//	Imposto titolo e classe
		$('.modal-title', modale).html( titolo || messaggio.titolo ).addClass( classe );
		//	Imposto contenuto
		$('.modal-body', modale).html( testo || messaggio.testo );

		modale.modal();

	};

	this.inserisciModale = function(){

		var modale = '<div class="modal fade" id="' + idModale + '"> <div class="modal-dialog"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button> <h4 class="modal-title"></h4> </div> <div class="modal-body"> </div> <div class="modal-footer"> <button type="button" class="btn" data-dismiss="modal">Ok</button> </div> </div> </div> </div>';

		$('body').append(modale);
		return $('#' + idModale);

	};

	//	Eseguiamo processa
	me.processa();

	return this;	
}
