import pandas as pd
import json
from os import listdir
import numpy as np

# sound libs
import librosa
import pyAudioAnalysis as pya
from pyAudioAnalysis import audioTrainTest
from pyAudioAnalysis import audioBasicIO
from pyAudioAnalysis import ShortTermFeatures
from pyAudioAnalysis import MidTermFeatures
import matplotlib.pyplot as plt
note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

short_features_selected = ['spectral_centroid', 'spectral_spread', 'zcr']
for start in ['chroma', 'mfcc']:
    for i in range(13):
        short_features_selected.append(start+"_"+str(i))

class AudioScene():
    def __init__(self, filepath,sample_duration=1, sample_interval=10):
        self.filepath = filepath
        self.sample_duration = sample_duration
        self.sample_interval = sample_interval

        # Fs - sample rate, x - audio signal as nparray
        [self.Fs, self.x] = audioBasicIO.read_audio_file(filepath)

        # convert stereo to mono
        if self.x.shape[1] == 2:
            # print("converting stereo to mono")
            self.x = np.mean(self.x, axis = 1)
        
        

        # set up the window size and step size
        self.short_window_size = .05*self.Fs
        self.short_step_size = .02*self.Fs
        self.mid_window_size = 2.0 *self.Fs
        self.mid_step_size = 1.0*self.Fs
        # print('windowInfo:',  self.short_window_size, self.short_step_size, self.mid_window_size,   self.mid_step_size )

        # print('computing shorterm features')
        self.short_features, self.short_feature_names = ShortTermFeatures.feature_extraction(self.x, self.Fs, self.short_window_size, self.short_step_size)

        # print('computing midterm features')
        self.mid_features, _, self.mid_feature_names  = MidTermFeatures.mid_feature_extraction(
            self.x,
            self.Fs, 
            self.mid_window_size,
            self.mid_step_size,
            self.short_window_size,
            self.short_step_size)

    def getSamples(self):
        print("Fs:", self.Fs)
        print("sample_duration:", self.sample_duration)
        print("sample_interval:", self.sample_interval)
        numSegmentSamples = int(self.sample_duration * self.Fs) #duration of sample * sample rate
        numIntervalSamples = int(self.sample_interval *self.Fs)
        numSamples = len(self.x)

        segments = []
        for start in range(0, numSamples, numIntervalSamples):
            end = start + numSegmentSamples
            if end <= numSamples:
                segments.append(self.x[start:end])
        if segments:
            self.x = np.concatenate(segments)

        return segments

    def getData(self):
        segments = self.getSamples()
        data = []

        for i, segment in enumerate(segments):
            entry = {}
            short_features, feature_names = ShortTermFeatures.feature_extraction(
                                        segment, self.Fs, self.short_window_size, self.short_step_size
                                    )
            for name, values in zip(feature_names, short_features):
                if name in short_features_selected:
                    entry[f"{name}_mean"] = float(np.mean(values))
                    entry[f"{name}_min"] = float(np.min(values))
                    entry[f"{name}_max"] = float(np.max(values))
            avgamp, _ = self.getAmplitude(segment)
            entry.update({
                'index':i,
                'seconds':i*self.sample_interval,
                'amplitude_avg':avgamp
            })
            data.append(entry)
        return data


       

    def getBeat(self):
        bpm, ratio = MidTermFeatures.beat_extraction(self.short_features, 1)
        return bpm
    
    def getNotes(self, segment,threshold = .05):
        chromagram, time_axis, _ = ShortTermFeatures.chromagram(segment, self.Fs, self.short_window_size, self.Fs)
        chromagram = chromagram.T
        notes_at_timestamps = {}
        for i, time in enumerate(time_axis):
            # each column is that time index, so just look at this time index
            chroma_frame = chromagram[:, i] 
            active_notes = np.where(chroma_frame>threshold)[0]

            detected_notes = [note_names[note] for note in active_notes]
            notes_at_timestamps[time] = detected_notes
        return notes_at_timestamps
    
    def getAmplitude(self, segment):
        peak_amplitude = np.max(np.abs(segment))
        return float(peak_amplitude),np.abs(segment)
    
    def getEnergy(self,segment):
        energy = librosa.feature.rms(y=segment, hop_length=self.Fs)
        avg = sum(energy[0])/len(energy[0])
        return float(avg), energy
    
  
    
# # TESTINGGGG
# sceneAudio = AudioScene('./tmp/pingu/audios/4.wav')
# print(sceneAudio.getData().keys())
# # print(sceneAudio.getBeat())