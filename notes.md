#Enhancements
- disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement a note velocity modulator. Should add some expression to notes
- consider using slow time line scrolling during preview
- the Edit Preferences function is currently disabled as the web client protocol will not allow access the the full path of files for security reasons. Similarly, a Recent Files function is not available. Finding a way around this limitation would be wonderful. 

#Bugs
- preview issues
    - watch that pause/resume working properly and that the preview always starts at the proper place.
- the general user flute preset cannot play faster than 180 BPM. It generates silence above that speed. must be something about the attack, sustain, or release. At 200BPM, the repeat rate is 300ms. The flute at midi 72, and velocity of 63, the attack, sustain, and release are 4.8ms, 952ms, and 250ms respectively. There is no delay, hold, or decay.

#4.0.1 Updates
- fixed error in random number genertor
- correct autoregressive current value calculator
- step changes to start and stop time in generator dialog
