
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


import subprocess
import json
import shutil
import os, tempfile, subprocess

from processing.audio.audioData import getAudioData
from processing.image.imageData import getImageData
from processing.captions.captionsData import getCaptionData
# from settings.settings import pathConfig


"""
inputting a movie file, it then:
1. if its a youtube link, it downloads it to a video
2. splits the video in n_samples videos, and corresponding audio files and images
3. gets the color information for each scene imageSceneData.json
4. gets the audio data for each scene and saves it in audioSceneData.json
5. gets the caption data
6. saves a compiled scene data
"""
def clear_directories(mainDir):
    for dir_name in ['videos', 'images', 'audios']:
        dir_path = os.path.join(mainDir, dir_name)
        if os.path.exists(dir_path) and os.path.isdir(dir_path):
            shutil.rmtree(dir_path)
            print('deleted dir', dir_name)


# each step
def download_video(dataDir, youtubeLink, captions):
    try:
        print( "YOUTUBE", os.getenv("YT_OAUTH_CLIENT_ID"))
        result: subprocess.CompletedProcess = subprocess.run(
            [
                "yt-dlp",
                "-f", "bestvideo[height<=720]+bestaudio/best[height<=720]",
               
                "--cookies", 'cookies.txt',
                "--merge-output-format", "mp4",
                "--write-subs",
                "--sub-lang", "en",
                "--convert-subs", "ass",
                "-o", dataDir + "video.mp4",
                youtubeLink
            ],
            check=True,            # raises CalledProcessError on non-zero exit
            capture_output=True,
            text=True
        )
        print("Download stdout:", result.stdout)
        print("Download stderr:", result.stderr)
        print("Video download completed with exit code", result.returncode)
        if captions:
            cmd2 = ["yt-dlp","--skip-download","--write-auto-sub","--sub-lang","en",
                    "--sub-format","ass","-o",dataDir+"captions.ass", youtubeLink]
            subprocess.run(cmd2, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"Command `{e.cmd}` failed with exit code {e.returncode}")
        print("stderr:", e.stderr)

def split_video(dataDir, numSamples):
    subprocess.run(['node','./processing/processVideo.js', dataDir, str(numSamples)],
                   check=True, capture_output=True, text=True)

def load_video_info(dataDir):
    with open(dataDir+"videoInfo.json") as f:
        return json.load(f)

def process_images(dataDir, name):
    getImageData(dataDir, name)

def process_audio(dataDir, name):
    getAudioData(dataDir, name)

def process_captions(name, videoInfo):
    dataDir = './data/tmp/'+f"{name}/"
    if os.path.exists(dataDir+'video.en.ass'):
        print('captions found...processing them')
        getCaptionData(name, round(videoInfo['sampleLength']))
    print("no captions found")


def getData(movie, name, numSamples = 20, youtubeLink = False, captions = False):
    dataDir = './processing/data/tmp/'+f"{name}/"
    print(dataDir)
    clear_directories(dataDir)
    os.makedirs(dataDir, exist_ok=True)

    #1. if its a youtube link, it downloads it to a video
    if youtubeLink != False:
        try:
            command = [
               'yt-dlp',
                '-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]',
                '--merge-output-format', 'mp4',
                '-o', dataDir + "video.mp4",
                youtubeLink
            ]
            # command = ['yt-dlp', '-f', 'bestvideo+bestaudio', '-o', dataDir + "video.mp4", youtubeLink]
            result = subprocess.run(command, capture_output=True, text=True, check=True)

            if captions:
                command1 = ["yt-dlp","--skip-download","--write-auto-sub", "--sub-lang", "en","--sub-format", "ass","-o", dataDir + "captions.ass",youtubeLink]
                result1 = subprocess.run(command1, capture_output=True, text=True, check=True)
            # captions = True

        except subprocess.CalledProcessError as e:
            print("Error downloading video:", e.stderr)
            return

    #2. splits the video in n_samples videos, and corresponding audio files and images
    command = ['node', './processing/processVideo.js',dataDir, str(numSamples)]
    print(command)
    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        print("Split video successfully")
        print(result)
    except subprocess.CalledProcessError as e:
        print("Error processing video:", e.stderr)
        return
    
    #get the info of the video
    videoInfo = None
    with open(dataDir+"videoInfo.json", 'r') as file:
        videoInfo = json.load(file)
    if(videoInfo == None):
        print("Error getting video info:", e.stderr)
        return
    

    #3. gets the color information for each scene imageSceneData.json
    all_colors, main_colors = getImageData(dataDir,name)
    image_df = pd.DataFrame(main_colors)
    image_df["movie"] = movie

    # save to the data file
    image_csv =os.path.join('./data/', "image_data.csv")
    image_df.to_csv(image_csv, mode='a', index=False,header=not os.path.exists(image_csv) )


    #4. gets the audio data for each scene and saves it in audioSceneData.json
    audio_data = getAudioData(dataDir,name)
    audio_df = pd.DataFrame(audio_data)
    audio_df['movie']= movie
    

    # save to the data file
    os.makedirs('./data/', exist_ok=True)
    audio_csv = os.path.join('./data/', "audio_data.csv")
    audio_df.to_csv(audio_csv,mode='a',index=False,header=not os.path.exists(audio_csv))



# import sceneLinks
# for movie in sceneLinks:
#     getData(movie['name'], 1, youtubeLink=movie["url"], captions = False)
# print("hellow")
# getData('lalaland', 1,'https://www.youtube.com/watch?v=K9VWhHJaSjA',captions = False)

import pandas as pd
df = pd.read_csv('./data/scenelinks.csv')
print(df.head())
df["name"] = df["movie"].str.replace(" ", "-", regex=False).str.replace(":", "-", regex=False)
print(df.head())
for idx, row in df.iterrows():
    if not os.path.exists(f'./processing/data/tmp/{row["name"]}/'):
        print("Processing: "+row["movie"])
        try:
            getData(row["movie"], row["name"],1, row["link"],captions = False)
        except Exception as e:
            print(print("ERROR", row["movie"]))
            print(print(e))
    else:
        print("Skipping", row["movie"])