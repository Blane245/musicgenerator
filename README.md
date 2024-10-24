# Rambling
I want a music generator that will play one or more voices using various note generators. The generators may be sequnces random walk, or stocastic up to 3 degrees. Each voice can be assigned to a sound font file bank and preset. 
Voice controls include
* start and stop times (may be multiple)
* soundfont bank and preset
* generation algorithm for note midi number (sine, triangular, square, randon walk, stocastic, e.g)
* generation algorithm for note modulation around the midi number
* generation algorithm for note start time
* generation algorithm for note duration 
* envelop controls (velociy, attack, decay, sustain, hold, release, volume) these may be changed over time
Files
* piece generation parameters (like JSON)
* generated sequence (XML)
* sound export (mp3, wav, etc.)
# Application structure
![CMG Class diagram](ComputerMusicGenerator-2024-10-24-133419.png)
# The CMG file structure
A generate configuration is defined by an XML file that has then folloing structure

```xml
<?xml verson="1.0"?>
  <fileContents
    name = 'string'
    timeLineStyle = 'int'
    tempo = 'int'
      beatsPerMinute = 'int'
      measureUnit = 'int'
    snap = 'boolean'
    measureSnapUnit = 'int'
    secondSnapUnit = 'int'
    SFFileName = 'string'
  >
    <tracks>
      <track 
        name = 'string'
        mute = 'boolean'
        solo = 'boolean'
      >
        <generators>
          <generator
            name = 'string'
            startTime = 'float'
            stopTime = 'float'
            type = 'string' // (could be CMG, SFPG, SFRG, Noise)
            preset = 'Preset'
            presetNumber = 'int'
            midi = 'int'
            FMType = 'int'
            FMAmplitude = 'float'
            FMFrequency = 'float'
            FMPhase = 'float'
            VMCenter = 'int'
            VMType = 'int'
            VMAmplitude = 'float'
            VMFrequency = 'float'
            VMPhase = 'float'
            PMCenter = 'int'
            PMType = 'int'
            PMAmplitude = 'float'
            PMFrequency = 'float'
            PMPhase = 'float'
          />
        <generators/>
      <track/>
    <tracks/>
  <fileContents/>
```
#Thanx
Special thanx to various people
* My son, Ryan Lane, that got me into web-based programming
* sfumato - who revealed the complexities of soundfont signal processing
* WebAudio documentation, particulary the authors of the page [Advanced techniques: Creating and sequencing audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
* Russell Good for his blog [How to Convert an AudioBuffer to an Audio File with JavaScript](https://russellgood.com/how-to-convert-audiobuffer-to-audio-file/)
* Duckduckgo search engine that helped me hack by way through this
