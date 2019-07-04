#! /usr/bin/env python3

class InvalidToken(Exception):
	pass

#my imports
import argparse
import configparser
import pyaudio  
import wave
import os

#microsoft api imports
import http.client, urllib.parse, json
from xml.etree import ElementTree

def getAccessToken():
	apiKey = "<enter your api key>"

	params = ""
	headers = {"Ocp-Apim-Subscription-Key": apiKey}

	AccessTokenHost = "api.cognitive.microsoft.com"
	path = "/sts/v1.0/issueToken"

	# Connect to server to get the Access Token
	conn = http.client.HTTPSConnection(AccessTokenHost)
	conn.request("POST", path, params, headers)
	response = conn.getresponse()

	data = response.read()
	conn.close()

	token = data.decode("UTF-8")
	with open("config/token.txt", "w") as f:
		f.write(token)
	
	return token

def getConfiguration(configFile):
	if configFile == 'pl.ini':
		config = {'locale':{'lang':'pl-PL', 'voice':'PaulinaRUS', 'gender':'Female'}}
	elif configFile == 'en.ini':
		config = {'locale':{'lang':'en-US', 'voice':'JessaRUS', 'gender':'Female'}}
	else:
		config = None

	return config 
	
def getAudio(accessToken, config, textFile):
	body = ElementTree.Element('speak', version='1.0')
	body.set('{http://www.w3.org/XML/1998/namespace}lang', 'en-us')
	voice = ElementTree.SubElement(body, 'voice')
	voice.set('{http://www.w3.org/XML/1998/namespace}lang', config['locale']['lang'])
	voice.set('{http://www.w3.org/XML/1998/namespace}gender', config['locale']['gender'])
	voice.set('name', 'Microsoft Server Speech Text to Speech Voice (' + config['locale']['lang'] 
			  + ', ' + config['locale']['voice'] + ')')
	
	output_file = "temp.wav"
	with open(textFile, "r") as f:
		voice.text = f.read();
		if voice.text:
			output_file = "speech_records/" + voice.text.replace(' ', '_').strip()+".wav"
			output_file = ''.join([i if ord(i) < 128 else '' for i in output_file])

	headers = {"Content-type": "application/ssml+xml", 
				"X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm",
				"Authorization": "Bearer " + accessToken, 
				"X-Search-AppId": "07D3234E49CE426DAA29772419F436CA", 
				"X-Search-ClientID": "1ECFAE91408841A480F00935DC390960", 
				"User-Agent": "TTSForPython"}

	conn = http.client.HTTPSConnection("speech.platform.bing.com")
	conn.request("POST", "/synthesize", ElementTree.tostring(body), headers)
	response = conn.getresponse()
	
	if response.status != 200:
		print(response.status, response.reason)
		raise InvalidToken
	print(response.status, response.reason)

	data = response.read()
	conn.close()

	
	with open (output_file, 'wb') as file:
		file.write (data)
		#print ("Wrote data to output file.")
	return output_file
	
def playAudio(outputFile): 
	#define stream chunk   
	chunk = 1024  

	#open a wav format music 
	f = wave.open(outputFile,"rb")  
	
	p = pyaudio.PyAudio()  
	#open stream  
	stream = p.open(format = p.get_format_from_width(f.getsampwidth()),  
					channels = f.getnchannels(),  
					rate = f.getframerate(),  
					output = True)  
	#read data  
	data = f.readframes(chunk)  

	#play stream  
	while data:  
		stream.write(data)  
		data = f.readframes(chunk)  

	#stop stream  
	stream.stop_stream()  
	stream.close()  

	#close PyAudio  
	p.terminate()

if __name__ == "__main__":
	#command line arguments parsing
	parser = argparse.ArgumentParser()

	parser.add_argument("-l", "--locale", help="Locale name. Default: en", dest="locale", default="en")
	parser.add_argument("-t", "--text", help="Text file name", dest="text", default="temp/text.txt")
	args = parser.parse_args()

	configFile = args.locale +".ini"
	textFile = args.text
	
	outputFile = "temp.wav"
	try:
		with open(textFile, "r") as f:
			txt = f.read();
			if txt:
				outputFile = "speech_records/" + txt.replace(' ', '_').strip()+".wav"
				outputFile = ''.join([i if ord(i) < 128 else '' for i in outputFile])
		if(not os.path.isfile(outputFile)):
			raise FileNotFoundError
	except FileNotFoundError:
		try:
			with open("config/token.txt", "r") as f:
				accessToken = f.read()

			try:
				outputFile = getAudio(accessToken, getConfiguration(configFile), textFile)
			except InvalidToken:
				raise FileNotFoundError
		except FileNotFoundError:
			outputFile = getAudio(getAccessToken(), getConfiguration(configFile), textFile)
	
	#and run audio
	playAudio(outputFile)
