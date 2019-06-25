const	fs = require('fs');
const	tts	=	require("child_process");
var sync = require('synchronize')
var sleep = require('sleep');

var WatsonSTT = require('./stt');
var	TJBot	=	require('tjbot');
var	config = require('./config/config');

var	credentials	=	config.credentials;

var	hardware = ['led', 'microphone', 'speaker', 'servo'];

var	tjConfig = {
		log: {
				level: 'error'
		},
	speaker:	{
				speakerDeviceId: "plughw:1,0"	
	},
		listen:	{
				microphoneDeviceId:	"plughw:1,0",
				inactivityTimeout: -1,
				language:	'en-US'
		}
};
var ws = new WatsonSTT();
var	tj = new TJBot(hardware, tjConfig, credentials);

var	words_en = ["spring",	"summer",	"autumn",	"winter",	"black", "white",	"red",
						 "green",	"blue",	"yellow",	"mom", "dad",	"sister",	"brother", 
						 "child",	"car", "plane",	"bus", "train",	"play",	"eat", "go", "sleep",
						 "school", "student",	"teacher", "apple",	"banana",	"tomato",	"pickle"];

var	words_pl = ["wiosna",	"lato",	"jesień",	"zima",	"czarny",	"biały", "czerwony",
										"zielony", "niebieski",	"żółty", "mama", "tata", "siostra",	"brat",
										"dziecko", "samochód", "samolot",	"autobus", "pociąg", "grać", "jeść", "iść",	"spać",
										"szkoła",	"uczeń", "nauczyciel", "jabłko", "banan",	"pomidor", "ogórek"];

var	numbers	=	[0,1,2,3,4];
var numbersLength = 5;

var correctWords = 0;

var	wordsIndex	=	0;
var	expected_value = "green";//words_en[0];
var	isDictionaryTask = false;

var poems = ["tiger", "fox", "tortoise"];
var poemIndex = Math.floor(Math.random()	*	3);

var additionWordsLearning = false;
var isScenarioPart_2 = false;

var alternatives = [];
var word = null;
var probability = null;
var isListening = true;
var isSong = false;

function randNumbers(){
	for(var i = 0; i < numbersLength; i++){
		  numbers[i] = Math.floor(Math.random() * words_pl.length);
      //words_pl.splice(numbers[i], 1);
      //words_en.splice(numbers[i], 1);
	}
	console.log(numbers);
}

function speak(text, language="en"){
	 return new Promise(resolve => {
		//console.log(text);
		var textFile	=	'temp/text_' + Math.floor((Math.random()	*	1000)	+	1) + '.txt';
		//resolve(
		fs.writeFile(textFile,	text);//,	(resolve,	err) =>	{
				//if (err) throw err;
		 setTimeout(()=>{
				resolve(tts.execSync('python3 tts.py -l '+ language +' -t ' + textFile));
		 }, 300);
		
	});
}

function speakWellKnownText(fileName){
	//tj.play('sounds/'+fileName)
  tts.execSync('aplay sounds/'+fileName);
}

function exitProgram(){
	speakWellKnownText("exit.wav");
	//speak("Do zobaczenia	nastepnym	razem",	"pl");
  tts.execSync('rm -rf temp/text*');
	process.exit(0);
}

async function startDictionaryTask(){
	if(isDictionaryTask){
		//speakWellKnownText("juz_nauka.wav");
		await speak("Nauka słówek	już	trwa", "pl");
	}else{
    	randNumbers();
    	correctWords = 0;
		isDictionaryTask = true;
		wordsIndex	=	0;
    
    //speakWellKnownText("rozpoczynamy.wav");
		//await speak("Rozpoczynamy	naukę	słówek.	Powtarzaj:", "pl");
		expected_value = words_en[numbers[wordsIndex]];
		 await speak(words_pl[numbers[wordsIndex]], "pl");
		 await speak(words_en[numbers[wordsIndex]], "en");
		await speak("Teraz twoja kolej","pl");
	}
	ws.micInstance.resume();
}

function getStringForResult(result)
{
	switch(result)
	{
		case 0:
			return "Dzisiaj nie odpowiedziałeś na żadne słowo. Spróbuj jeszcze raz później.";
		break;
		case 1:
			return "Odpowiedziałeś na jedno słówko.";
		break;
		case 2:
			return "Odpowiedziałeś na dwa słówka.";
		break;
		case 3:
			return "Odpowiedziałeś na trzy słówka.";
		break;
		case 4:
			return "Odpowiedziałeś na cztery słówka.";
		break;
		case 5:
			return "Odpowiedziałeś na pięć słówek.";
		break;
	}
}

async function dictionaryTask(isCorrect)
{
	if(isCorrect == 1){
		tj.shine("green");
		await speak("Wspaniale!", "pl");
		tj.shine("white");
    	correctWords++;
		
	}else if(isCorrect == 2){
		tj.shine("blue");
		await speak("Prawie dobrze", "pl");
		tj.shine("white");
		correctWords++;
	}else{
		tj.shine("red");
		await speak("Niestety trochę inaczej", "pl");
		tj.shine("white");
	}
		wordsIndex++;
		if(wordsIndex==numbersLength){

			await speak(getStringForResult(correctWords), "pl");
			isDictionaryTask = false;
			if(isScenarioPart_2)
			{
				tj.shine("yellow");
				await speak("A to na zakończenie jeszcze powiem wam wierszyk", "pl");
				await speakPoem(poems[++poemIndex % poems.length]);
				scenarioPart_3();
			}else{
				//ws.micInstance.pause();
				scenarioPart_2();
			}

		}else{
			expected_value	=	words_en[numbers[wordsIndex]];
			await speak(words_pl[numbers[wordsIndex]],"pl");
			await speak(words_en[numbers[wordsIndex]],"en");
			await speak("Teraz twoja kolej","pl");
			ws.micInstance.resume();
		}
}

function speakPoem(poem){
	return new Promise(resolve => {
		resolve(tts.execSync('bash config/poem.sh ' + poem));
	});
}

function singSong(){
  //wytłumacz niech klaszczą tupają albo mówią okej, i czy pociąć to?
	
  return new Promise(resolve => {
	resolve( tts.exec('aplay sounds/happy_short.wav'));
  });
}

function waveHand(){
  tj.wave();
}

function shineDiods(){
  tj.shine(tj.randomColor());
}

function disco(){
	for(var i = 0; i < 10; i++)
	{
		shineDiods();
		sleep.msleep(500);
	}
}

function discoSong(){
	//full version 164 s
	for(var i = 0; i < 38; i++)
	{
		shineDiods();
		sleep.msleep(500);
	}
}

function onEvent(event) {	

	var myJson = JSON.parse(JSON.stringify(event.results, null, 2));
	for(var i in myJson)
	{
		if(myJson[i].hasOwnProperty("final") && myJson[i].final == true)	
		{
			ws.micInstance.pause();
			alternatives = [];
			for(var j in myJson[i].alternatives)
			{
					alternatives.push(myJson[i].alternatives[j].transcript);
			}
			word = JSON.stringify(myJson[i].alternatives[0].word_confidence[0][0]).toString();
			probability = JSON.stringify(myJson[i].alternatives[0].word_confidence[0][1]);		
			console.log(word);
			if(isDictionaryTask)
			{
				console.log(alternatives);
				if(word.indexOf(expected_value)>=0){
					dictionaryTask(1);
				}else if(alternatives.indexOf(expected_value + ' ')>=0){
					//console.log(alternatives);
					dictionaryTask(2);
				}else{
					//console.log(alternatives);
					dictionaryTask(0);
				}
			}else if(isScenarioPart_2){
				if(word.indexOf("no")<0){
					console.log("start scenarion part 3");
				  	startDictionaryTask();
				}else{
					scenarioPart_3();	
				}
			}else{
				scenarioPart_3();
			}
		}
	}
}
async function scenarioPart_1(){
	
	await speak("Cześć, jestem tidżej bot. Potrafię dużo rzeczy. Chcecie zobaczyć jak macham ręką?", "pl");
	await speak("I tak wam pokaże.", "pl");
	await waveHand();
	await waveHand();
	
	await speak("A wiecie co jeszcze potrafię?", "pl");
	await speak("Mrugać diodami!", "pl");
	await disco();

	await speak("A teraz nauczymy się paru słówek po angielsku. Najpierw ja będę powtarzał słowa, a potem wy. Zacznijmy!", "pl");
	await startDictionaryTask();
}

async function scenarioPart_2(){
	isScenarioPart_2 = true;
	isDictionaryTask = false;
	
	tj.shine("yellow");
	await speak("Znam jeszcze parę wierszyków.", "pl");
	await speakPoem(poems[poemIndex]);
	await speak("A w nagrodę, za to że tak dobrze wam poszło, zaśpiewamy piosenkę!", "pl");

	singSong();
	discoSong();
	
	//await speak("A może chcecie się jeszcze pouczyć słówek!", "pl");
	
	scenarioPart_3();
}
	
async function scenarioPart_3(){
	await tj.shine("white");
	await speak("To już koniec na dziś", "pl");
	await speak("Do zobaczenia następnym razem!", "pl");
	await waveHand();
	await shineDiods();
	await waveHand();
	await shineDiods();
	await waveHand();
	ws.micInstance.stop();
	setTimeout(function(){ process.exit(0); }, 3000);
}
ws.start(onEvent);
ws.micInstance.pause();
//start of scenario
scenarioPart_1().then(() => {
	//process.exit(0);
});