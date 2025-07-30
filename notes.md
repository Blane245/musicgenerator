#Enhancements
- implement a graphical display during preview. Show notes as bars
- disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement a note velocity modulator. Should add some expression to notes
- consider using slow time line scrolling during preview

#Bugs
- preview issues
    - when exiting from preview in the generator dialog, the state returns to displaying the composition, not the generator dialog, 
- the general user flute preset cannot play faster than 180 BPM. It generates silence above that speed. must be something about the attack, sustain, or release. At 200BPM, the repeat rate is 300ms. The flute at midi 72, and velocity of 63, the attack, sustain, and release are 4.8ms, 952ms, and 250ms respectively. There is no delay, hold, or decay.

#3.6.1 Release notes
- implemented graphical display for preview
- refactored generator icons as it was getting quite large
- repairs to time interval processing and display
- implemented zero duration delay, attack, hold, decay, release
- repaired add generator menu and generator icon menu scrolling
- disabled all functions except stop recording and preview when playing
