notes on the euclidean algorithm as applied to music 
1. rhythm sequences 
given two integers a and b, where b >= a, the euclidean algorithm returns the 'best' rhythm pattern, where a is the number of heard beats, b is the 'measure', and b-a is the number of unheard beats. 

This can be applied to the starting times of notes. The beat rate (BPM) can be fixed or varied by the SFPG or SFRG algorithm.
2. note sequences/scales
within the octave, the euclidean algorithm can be used to select the notes that can be played by setting b = 12 and letting a vary from 1 to 11.

framework from the Euclidean generator
| Parameter | meaning |
| --- | --- |
| measureLength | the total number of beats in the measure |
| beatCount | the number of heard beats in the measure |
| baseNote | the midi number of the lowest number on the scale |
| noteCount | the number of notes selected from the scale |
| speed attributes | the starting speed and the speed changing parameters (could be programmatic or Markovian) |
| volume attributes | similar to spped attributes |
| pan attributes | similar to speed attributes |
| preset | the soundfont preset for the voice |
| looping | whether or not to loop the preset's samples |