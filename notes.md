# things to to
# Bugs
- when previewing in the generator dialog, changes made to the parameters are lost after the preview. Somehow the dialog has to be reactivated after a preview with these changes but not update the fileContents with the formdata
- preference editor throws error message about soundfont not in directory
# Enhancements
- implement sequencing
- (don't think this is necessary as envelope processing has improved) disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement granular synthesis to achieve vibrato, tremelo, glissandi, and other effects
- consider using slow time line scrolling during preview
- pipe dream - add a video producer that takes hints from the composer and does drawings based on the sounds and those hints. See the ChatGPT chat on scribble for some guidance on structural hints from the composer. 
- implement soundfont modulators - this is very complicated and adds alot of controls to each instrument. It would give me better control over attenuation, which is currently problematic. 
- give user control of spectrum parameters and implement sonogram

# 4.2.1 Updates
- provided download for the user manual
- file open/saveas dialogs only display recent directory contents the first time.
- corrected timing unit problem in room reverb
- improved menu layout
- added tools menu with some useful calcultors and generator mods for time aligning, setting durations equal, and time staggering
- implemented track duplicate and shift tools and volume setting
- implemented timeline measure/beat mode of display
- implemented generator move snapping in both time and measure mode
- changed preview volume graphic from sliders to a time plot
- added offset to euclidean rhythm https://blog.landr.com/euclidean-rhythms/
- added a duplicate track function


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
