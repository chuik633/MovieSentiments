import pandas as pd
import json
from os import listdir
import numpy as np

from .singleAudioSceneData import AudioScene

def getAudioData(dataDir,name):
    audioDir = dataDir+'audios/'
    audioFilenames = [f for f in listdir(audioDir) if f.endswith('wav')]

    all_audio_Data = []
    for audioFilename in audioFilenames:
        file_name_info = audioFilename.split('.')
        if len(file_name_info[0])>0:
            i = int(file_name_info[0])
        else:
            print("ERROR:",audioFilename)
        sceneAudio = AudioScene(audioDir+audioFilename)
        entry = sceneAudio.getData()

        all_audio_Data.append(entry)
    with open(dataDir + 'audioSceneData.json', 'w') as f:
            json.dump(all_audio_Data, f, indent=2)
    
    if len(all_audio_Data) ==1:
         return all_audio_Data[0]
    else:
         return all_audio_Data
    # audio_df = pd.DataFrame(all_audio_Data)
    # audio_df.to_json(dataDir+'audioSceneData.json', orient = 'records')


