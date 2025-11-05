# things to know    
for match conditional statements in HTML
/\{g\.(.*)\?.*\n(.*).*\n.*\).*/
# things to do
- implement tremelo and vibrato effects. This may cause some refactoring as some of the source files are getting quite large. 
    - Vibrato may be a rapid repitition of the same note or alternating notes. This form can be done by using an oscillator on the note attribute along with a rapid speed. It may also be a pitch variation that has a rate, depth, and wave form and generates microtones. Pitch variation would be implemented as a change in playback rate.
    - Tremelo is a change in volume. It may also have a rate, depth, and wave form.
    - As these effects are modification of existing attributes, they could be implemented a properties of these attributes. The effects would be realized as modifications to the samples generated when the instrument sample is being processed.
        - in the case of pitch variation vibrato, this is realized by modifying the playback rate during the conversion of the instrument sample into the final sample. The playback rate woudl be calculated each time interval.
        - in the case of tremelo, the volume envelope processing will be changed. This will put modulations on the volume envelope thus creating many more points. There may need to be considering for using a higher order interpolation that linear to smooth out the transitions when the envelope is applied. 
- measure lengths are not constant in time when the speed attribute is changed. Now, I have a measure length in seconds in preferences and that is what is used to draw the timeline. This is incorrect and in fact I'm not sure that the conversion from time to measures makes sense when generators can all run at their own speeds. The sequencers conversion is particularly bad. Maybe I should abandon measure display and data entry unless I can think of a solution. (haven't thought of one yet)
 # Bugs
 - DB problem. The connection to mysql times out after 24 hours of inactivity. I haven't found out how to restart it yet.
- when previewing in the generator dialog, changes made to the parameters are lost after the preview. Somehow the dialog has to be reactivated after a preview with these changes but not update the fileContents with the formdata. This is a result of the use of the .copy() method which signals a change similar to the stop time calucaltion mehoded above
- preference editor throws error message about soundfont not in directory everytim it is started
- the tools menu in the generator dialog is in the worn place and overlays the view present dialog when present
# Enhancements
- (don't think this is necessary as envelope processing has improved) disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement granular synthesis to achieve vibrato, tremelo, glissandi, and other effects
- consider using slow time line scrolling during preview
- pipe dream - add a video producer that takes hints from the composer and does drawings based on the sounds and those hints. See the ChatGPT chat on scribble for some guidance on structural hints from the composer. 
- implement soundfont modulators - (probably not) this is very complicated and adds alot of controls to each instrument. It would give me better control over attenuation, which is currently problematic. 
- give user control of spectrum parameters and implement sonogram

# 5.0.0 Updates
- implemented tremelo and vibrato for algorithmic generators
- implemented sequencing
- added a generator flag to bypass the attack envelope as an option. The attack part of the envelope seems to be overemphasizing signals that already have a lot of attack in them.
- rebalanced the various gains used throughout the application

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