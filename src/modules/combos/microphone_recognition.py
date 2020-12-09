#!/usr/bin/env python3

# NOTE: this example requires PyAudio because it uses the Microphone class

import sconfig
import speech_recognition as sr

# obtain audio from the microphone
#r = sr.Recognizer()
#with sr.Microphone() as source:
    #print("Say something!")
    #audio = r.listen(source)

#list = []

def mr():
    # recognize speech using Google Speech Recognition
    r = sr.Recognizer()
    harvard = sr.AudioFile('audio.wav')
    with harvard as source:
        audio = r.record(source)
    list = []
    try:
        # for testing purposes, we're just using the default API key
        # to use another API key, use `r.recognize_google(audio, key="GOOGLE_SPEECH_RECOGNITION_API_KEY")`
        # instead of `r.recognize_google(audio)`
        google = r.recognize_google(audio)
        print("Google Speech Recognition thinks you said " + google)
        list.append(google)
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
    except sr.RequestError as e:
        print("Could not request results from Google Speech Recognition service; {0}".format(e))


    #recognize speech using Wit.ai
    WIT_AI_KEY = sconfig.wit_api_key  # Wit.ai keys are 32-character uppercase alphanumeric strings
    try:
        wit = r.recognize_wit(audio, key=WIT_AI_KEY)
        print("Wit.ai thinks you said " + wit)
        list.append(wit)
    except sr.UnknownValueError:
        print("Wit.ai could not understand audio")
    except sr.RequestError as e:
        print("Could not request results from Wit.ai service; {0}".format(e))


    # recognize speech using Houndify
    HOUNDIFY_CLIENT_ID = sconfig.houndify_client_id  # Houndify client IDs are Base64-encoded strings
    HOUNDIFY_CLIENT_KEY = sconfig.houndify_client_key  # Houndify client keys are Base64-encoded strings
    try:
        houndify = r.recognize_houndify(audio, client_id=HOUNDIFY_CLIENT_ID, client_key=HOUNDIFY_CLIENT_KEY)
        print("Houndify thinks you said " + houndify)
        list.append(houndify)
    except sr.UnknownValueError:
        print("Houndify could not understand audio")
    except sr.RequestError as e:
        print("Could not request results from Houndify service; {0}".format(e))

    # recognize speech using IBM Speech to Text
    IBM_USERNAME = "apikey"  # IBM Speech to Text usernames are strings of the form XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    IBM_PASSWORD = sconfig.ibm_password  # IBM Speech to Text passwords are mixed-case alphanumeric strings
    try:
        ibm = r.recognize_ibm(audio, username=IBM_USERNAME, password=IBM_PASSWORD)
        print("IBM Speech to Text thinks you said " + ibm)
        list.append(ibm)
    except sr.UnknownValueError:
        print("IBM Speech to Text could not understand audio")
    except sr.RequestError as e:
        print("Could not request results from IBM Speech to Text service; {0}".format(e))

    thing = checkIfDuplicates(list)

    return (thing)


def checkIfDuplicates(listOfElems):
    ''' Check if given list contains any duplicates '''    
    for elem in listOfElems:
        if listOfElems.count(elem) > 1:
            return elem
    return listOfElems[0]