# things to to
- update documentation 
# Bugs
- take account of playback rate when determining samples and times. 
- under certain conditions, the reverb setting cause signal loss. This is a result of the convolving method used by Web Api. 
- remove name from compressor, etc.
- answering yes to overwrite on a open recent causes a read error
- loose comment edits before save (?)
- make 100% the default duration, not zero
- when adding a new algorithmic generator, the soundfont file lists the first file in the list, but it is not 'active'. Add a blank entry so it has to be changed
- when previewing in the generator dialog, changes made to the parameters are lost after the preview
# Enhancements
- enable/disable reverb, compressor, equalizer
- disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement a note velocity modulator. Should add some expression to notes
- implement granular synthesis to achieve vibrato, tremelo, glissandi, and other effects
- consider using slow time line scrolling during preview

# A local file server
A local directory/file server running on port 6001 has been written with the follow endpoints:
    - directory/list?name='name'
        - name is the full path name of the directory
        - response is {list: [
            {"type": "directory" | "file"}
            {"name": name of the file or directory without the name of the directory  }
            {"path": the name of the directory (identical to the one in the query)}
            ...],
            "error": nonblank if an error occurred

        }
    - file/read?name='name'
        - name is the fully qualified file name
        - response if {"file: {
            "type": "Buffer",
            "data": [byte array] (must handle binary soundfont files and JSON .cmg files)
        },
        "error": non blank oif an error occurred while reading
        }
    - file/write?name='name'&overwrite='true|false' where the contents parameter of the request is a byte array of the file contents
        - name is fully qualified file name
        - overwrite is 'true' | 'false' depending on whether the file should be ovewritten
        - contents is a byte array of the file contents (does this need to be stringyfied?)

Use cases for local file access include 
    - remember the last directory accessed for cmg, or recordings and use them as defaults when the user 
        selects one of the following action. Update the last directory when the user successfully finishes the
        function
    - navigate from one directory to another (this can get really complicated, so maybe do as enhancement)
    - let the user provide the directory path
    - configure the local soundfont files directory name (default is null, so must be set the first time CMG is used)
        - the prefernces menu
        - abandon the server access to soundfont files
    - get list of soundfont files in named directory (soundfont files have .SF2 or .sf2 types)
    - read a soundfont file and load it into a SoundFont2 object
    - get a list of .cmg files in named directory (for Open and SaveAs)
    - read a .cmg file and load it into a CMGFile object (for Open and Recent)
    - maintain a recent .cmg files list for quick access to previously accessed files
    - save a .cmg file that has been modified (overwrite=true)
    - saveAs a .cmg file. If the file aleady exists, prompt the user to confirm overwrite

# native signal processing
due to the difficulties I am having using the volume paramter to shapte theamplitude of each note, I am considering doing the amplitude signal processing on my own. It appears that there may be some phasing problems using volume ramping, but I am not sure. In any case, the idea is to take the sample from the midi instrument, determine the duration, add any necessary noise, adjust by the volume value and then apply the delay, attack, hold, decay, sustain, and release gains to the sample, then give this sample to the unity gain node of the instrument. 
The Soundfont protocol defines the following parameters for each instrument. all values are in centibels or timecents. If any timecents value is less that -12000, the values is considered to be zero

initialAttenuation - amount of attenuation to apply to the signal
delayVolEnv - the time from the start of the note to the first start of the attack phase. the signal during this period is 0 and no samples are consumed.
attackVolEnv - the time from the end of the delay time to the start of the hold phase. The signal increase linearly in dB from zero to full value.
holdVolEnv - the time from the end of the attack phase to the start of the decay phase. This signal stays a full level during the hold phase.
decayVolEnv - the time from the end of the hold phase to the start of the sustain phase. The signl decreases from full level to the sustain level (sustainVolEnv) duing the decay phase
sustainVolEnv - the decrease in level that occurs during the decay phase. A value of <=0 means no decay. A value >= 1000 means full decay. 
releaseVolEnv - the time from the end of the note to the minimum gain (100dB). The gain decreases from its value at the end of the note to the release time. The signal decreases from its level at the end of the note to zero during the release phase.

The duration of the note is determined by its speed (BPM, period = 60/BPM sec); however it may end early to simulate a staccato effect. If this effect is in play, the release time is set to zero.

A note has a frequency (midi), looping parameters, samples, sample rate, duration, stacatto effect, volume, and the envelope values listed above. It may also have gaussian noise. The idea is to turn all of this into a sample array that starts at 0 and ends when note release is complete.

The total of the envelope times (delayVolEnv to SustainVolEnv) may exceed the duration of the note, thus truncating the signal processing. The processing sequence may be as follows.
1. determine the total length of time of the note. Generate the total number of samples (totalTime) * sampleRate. TotalTime is given by 
    - If looping enabled totalTime = duration + releaseTime; otherwise it is the minimum of duration + releaseTime and the sampleSize of the original sample.
2. Copy the original sample to the preparedSample, including the needed zero-values delay samples and enough loops to fill the sample.
2. If noise is needed, apply it to the preparedSamples. Use the note frequency as the center of the gaussian distribution. 
3. Apply the fixed volume and attenuation to the sample. (convert dB to gain)
6. Set
    - delayEnd = delayTime
    - attackEnd = delayEnd + attackTime
    - holdEnd = attackEnd + holdTime
    - decayEnd = holdEnd + decayTime
    - noteEnd = duration
    - releaseEnd = noteEnd + releaseTime
5. (next ti) Loop through each sample point. Its time value (Ti) is i * sampleNumber / sampleRate (deltaT).
6. If (Ti > totalTime) we are done
6. If (ti < delayEnd) go to (next ti)
6. elseIf (Ti >= noteEnd) go to (releasePhase)
7. elseIf (T1 < attackEnd) determine the signal multiplier based on liner dB ramp from 0 to 1 and time since delaytTime. Set noteEndGain to this gain value
8. elseif (T1 < holdEnd) out sample is the input sample. Set noteEndGain to 1.
9. elseif (t1 < decayEnd) determine the signal multiplier based on linear db ramp from 1 to 0 and time since holdEnd. Set noteEndGain to this gain value
10. goto next ti
11. (releasePhase) if (ti < releaseEnd) determine signal mutiplier based on linear ramp from value at noteEndGain to 0. go to next ti

changes to make.
- remove things from RawSourceData
    - source: loopStart, loopEnd, loop, maybe stopTime
    - vol: all of it
- realizesource
    - remove the vol.gain calcs and replace with vol.gain.value = 1;
- loadpresetnote
    - modify to implement to above algorithm
- sourcereport 
    - eliminate columns delay - volume

# 4.0.1 Updates
- implement a way to end note tone earlier than its duration (stoptime-starttime) to achieve staccato effect. 
- fixed error in random number generator
- when a file is new or opened, reset the time interval
- file open/saveas dialogs only display recent directory contents the first time.
- correct autoregressive current value calculator
- step changes to start and stop time in generator dialog
- CMG now uses internet port 3006 rather than the default of 80.
- A recent Files capability was implemented. This required the services of a file server app running on the local machine on port 6001. Details on how to install and run this server is forthcoming. 
- Preview source duration reflects whether the source is looping or not
- GUI updates to the Generator Add/Modify dialog
- The time line pan and zoom setting are now part of the save composition. 