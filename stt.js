'use strict';

//export allow to import class from another module
module.exports = class WatsonSTT{
	constructor(){
		require('dotenv').config({ silent: true });
		
		//geting modules
		var SpeechToText = require('watson-developer-cloud/speech-to-text/v1');
		var mic = require('mic');
		var wav = require('wav');

		//username and password generated on ibm bluemix
		var speechToText = new SpeechToText({
			username: '<your username>',
			password: '<your password>'
		});
		
		this.micInstance = mic({
		  rate: '44100',
		  channels: '2',
		  debug: false,
		});
		
		this.micInputStream = this.micInstance.getAudioStream();

		this.wavStream = new wav.Writer({
		  sampleRate: 44100,
		  channels: 2,
		});

		this.recognizeStream = speechToText.recognizeUsingWebSocket({
		  content_type: 'audio/wav',
		  interim_results: true,
			objectMode: true,
			max_alternatives: 7,
			word_confidence: true,
		});
	}
	
	start(callback) {
		this.micInputStream.pipe(this.wavStream);

		this.wavStream.pipe(this.recognizeStream);
		this.recognizeStream.on('data', callback);
		this.recognizeStream.on('error', function(event) { console.log('Error'); });
		this.recognizeStream.on('close', function(event) {console.log('Connection closed'); });
		this.micInstance.start();
	}
};
