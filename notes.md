# things to do
- tune up signal processing - envelope processing seems to generate harsh timbres in some cases, but duration processing is included, so that the staccato effect is there.
- implement a algorithmic genertaor level flag to enable/disable the delay/attack part of the envelope
maybe implement duration separately. maybe implement a envelope flag for each generator?
- consolidate the sequencer with algorithms. If the note is a sequencer algorith, time increments with the note sequence. If not, time is used, and the measure and beats per measure are used to pick up any other attribute's values. Also, if any atribute is a sequencer and the note is not, this is an error and will be caught when the generator is being modified.
- streamline tools in the algorithmic and sequencer dialogs
- measure lengths are not constant in time when the speed attribute is changed. Now, I have a measure length in seconds in preferences and that is what is used to draw the timeline. This is incorrent and in fact I'm not sure that the conversion from time to measures makes since when genertors can all run at teir own speeds. The sequencers conversion is particularly bad. Maybe I should abandon measure display and data entry unless I can think of a solution. 
 # Bugs
 - stop time calculation not triggered on change to speed. I've partially implemeted but ran into some object casting problems in SequencerDialog useEffect designed to handle the spped change. The effect trigger everytin the formData.speedP object changs. I only want to change the stoptime when the speed value changes. I have written 'isEqual' methods for each of the algorithmvalue and sequencer objects but I can seem to cast object correctly for the holdSpeedP state...
- when previewing in the generator dialog, changes made to the parameters are lost after the preview. Somehow the dialog has to be reactivated after a preview with these changes but not update the fileContents with the formdata. This is a result of the use of the .copy() method which signals a change similar to the stop time calucaltion mehoded above
- preference editor throws error message about soundfont not in directory everytim it is started
# Enhancements
- implement sequencing
- (don't think this is necessary as envelope processing has improved) disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement granular synthesis to achieve vibrato, tremelo, glissandi, and other effects
- consider using slow time line scrolling during preview
- pipe dream - add a video producer that takes hints from the composer and does drawings based on the sounds and those hints. See the ChatGPT chat on scribble for some guidance on structural hints from the composer. 
- implement soundfont modulators - this is very complicated and adds alot of controls to each instrument. It would give me better control over attenuation, which is currently problematic. 
- give user control of spectrum parameters and implement sonogram

# 5.0.0 Updates

- implemented sequencing

A plan for a generator type that is based on note sequences.
- sequencing is like any other algorithm: it returns an attibute value at a certian time
- since the sequence db is independent of CMG, sequence that are in use by existing compositions may be affected so that they are no longer usable or generate a different sequence than when they were defined. 
- Sequences are defined in a database. See CMGSequenceEditor. When the database is changed, CMG must become aware of the changes. There are a few ways to do this.
    - make periodic request to the db to load all defined sequences (wasteful for compsition that do not use sequences)
    - when the sequence algorithm is selected for an attribute, load the sequences for that attribute (probably best) and filter out the ones that have no items. If the user wants that sequence, a change must be made to the db and the sequence algorithm reselected.
    - when recording or previewing, the used sequences must be reloaded. It will abort if a sequence is no longer available.
- each attribute (note, speed, attack, duration, volume, pan) has sequences that can be used to 
determine current values. Note has a name and a beat length. Other have a value and time. 
    - a sequence may have no items, in which case it cannot be used.
    - non-note sequences may not have a zero time value. In this case, the first entry is used as if the time was zero
    - note value at time - convert time to beat number (could be fractional) using measurelength and beatspermeasure
        - beat = inf(beatspermeasure * time / (measurelength)) 
        - accumulate the note item beats until they are greater than or equal to beat 
        - e.g. time = 27.3, beats/measure = 3, measurelength = 0.75
            beat = 3 * 27.3 / 0.75 = 109.2 
            beat sequence
                60  5
                61  10 (15)
                63  100 (115)
            note 63
    - other attributes are in time sequence order. Get the item entry that exceeds the time, back off one and there is the valu. Note t=0 special case.
- each of the atributes have the ability to select a valid sequence algorithm. Other parameters depend on the attribute.
    - a select field that selects from valid sequences
    - a button that allows the user to view the selected sequence
    - note: the note items may be transposed up and down
    - other: no other parameters
- the sequence algorithm dialog      

# Sequencer design

My first thought was to implement a sequencer using the algorithm generator, but after some trials discovered that the way time was handled was not in line with sequencing. Time should be driven by the beats in the note attribute and the current meter rather than the speed attribute. The source nodes are generated on each note beat with the other attributes (speed - pan) following. 

The sequence generator will have the note as a primary attribute that is a sequence. No need for the euclidean rhythm, notes/octave of euclidean shifts. The other attributes have be any of the existing algorithmic types include sequence. 

The preferences will change. Rather than a measure length in seconds, the meter in BPM will be specified. The time signature is unimportant as there is no intent to produce a written score. One limitation to this approach is that the measure definition cannot be changed during the composition. Thus shifts like 4/4 to 3/4 cannot be visualized on the time line. This might be done later by introducing a time signature element to the time line.