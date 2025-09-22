<style>
.note {
  background-color: rgb(114,74,6);
  color: white;
}
.picture {
display:block; 
margin-left: auto; 
margin-right: auto;
}
</style>
Computer Music Generator (CMG) User's Guide, Version 4.1.0
========================================================
**Table of Contents**
- [Introduction](#introduction)
- [Handling CMG Files](#handling-cmg-files)
  - [Create a New CMG File](#create-a-new-cmgfile)
  - [Open a CMG File](#open-a-cmg-file)
  - [Save a CMG File](#save-a-cmg-file)
- [Tracks](#tracks)
- [Generators](#generators)
  - [Generator Types](#generator-types)
    - [Silent](#silent)
    - [Algorithmic](#algorithmic)
    - [AudioFile](#audiofile)
  - [Generator Pulldown Menu](#generator-pulldown-menu)
  - [Moving a Generator Within Its Track](#moving-a-generator-within-its-track)
- [Timeline](#timeline)
  - [Timeline Control](#timeline-control)
  - [Timeline Interval](#timeline-interval)
- [Room Level Functions](#room-level-functions)
  - [Room Volume](#room-volume)
  - [Room Reverb](#room-reverb)
  - [Room Compressor](#room-compressor)
  - [Room Equalizer](#room-equalizer)
- [Previewing, Recording, and Reporting](#previewing-recording-and-reporting)
  - [Recording](#recording)
  - [Previewing](#previewing)
  - [Reporting](#reporting)
- [Glossary](#glossary)

# Introduction

The Computer Music Generator (CMG) application was inspired by the book [Formalized Music: Thought and Mathematics in Composition](https://en.wikipedia.org/wiki/Formalized_Music), by Iannis Xenakis, which I read many years ago and am just getting around to implementing something. Some of the features that Xenakis lays out are included along with other concepts of my own. This application will be enhanced as I locate other computer music generation concepts.

The features of the CMG include:
- Retention of defined sound generation files between working sessions,
- The use of SoundFont files to produce Midi sounds,
- The separation of sound generators into tracks that mimics the parts in a music score,
- Three types of sound generators, one of which is silent,
- Room level sound reverb, compression, equalization, and volume controls, and
- Previewing and recording of assembled compositions.

An example of a composition in progress is shown here:

![Example Composition](images/exampleinterface.png)

The layout of the screen includes a header section, a body section, and a footer section. 
* The header provides 
  * File, Edit, Generate, and Help pulldown menus,
  * the name of the application and its version, 
  * the name of the file currently being displayed, and
  * timeline controls and display.

* The body provides the display and control of composition tracks and generators.
* The footer has a status message display area, and controls for room level reverberation, compression, equalization, and volume. 

# Handling CMG Files 

CMG files are handled by the ***File*** Menu Items:

## Create a New CMGFile
* ***New File ...*** - When CMG starts, it has is ready to define a new composition file, default room volume, reverb, compressor, and equalizer settings, and no tracks or generators. At any time, this can be selected to clear the existing workspace. If changes have been made to the workspace since the last save, you will prompted to confirm that you want to delete these changes without saving:
![alt text](./images/ConfirmNewFile.png)

> <div class="note">*Note: The CMG screen header shows the name of the file currently being edited. If changes have been made since the last save, an asterisk <span style='color:lightblue'>(*)</span> will follow the file name.</div><br/>

![alt text](./images/TitleLine.png)

## Open a CMG File
* ***Open File ...*** - CMG files are opened by clicking the menu item ***Open File...*** button or by pressing **ctrl-o** on the keyboard. Files with the extent of ***.cmg*** are displayed and the one selected will be read. This includes all of the items that were saved (timeline, room compressor, room equalizer, room volume, room reverb settings, and all tracks and generators). If the file is not in proper format, a status message will be displayed and the file will not be opened. When a file is opened, it is placed on the top of the recent files list.

## Save a CMG File
* ***Save File*** - CMG files are created by accessing the menu item ***Save File*** or by pressing **ctrl-s** on the keyboard. The current CMG composition is written to the active file. Files may be placed anywhere that they can be accessed within the file system. Files are saved with a ***.cmg*** extent. If the file already exists, you will be prompted to agree with overwriting the existing file. This saves the room compressor settings, room equalizer settings, room volume settings, and room reverb settings, and all of the tracks and generators defined. 

## 'Save As' a CMG File 
* ***Save As...*** - CMG files can be saved under another name using this option. A file dialog is presented that allows the directory and file name to be specified. The current CMG composition is written to the named file. If the named file already exists, a popup window is displayed asking if the file can be overwritten. Once the file is saved, its name is placed on the top of the recent files list.
## Open Recent
* ***Open Recent...*** - Selecting this option will cause a list of up to 10 recently opened or saved files to be listed. The selected file will be read and placed on teh top of the recent files list.
> <div class="note">*Note: Long projects contain a lot of data and take some time to create. <span style='font-weight:bold;font-style:italic'>Ensure the file is fully saved before existing CMG or shutting done the computer. </span> The <span style='color:lightblue'>Status Bar</span> at the bottom shows a message when the file has been saved and the <span style='color:lightblue'>(*)</span> will disappear from the title line.</div>

# Tracks

A computer generated piece of music is constructed by defining tracks and placing generators along them at various start time and end times. By clicking the menu item ***New Track*** button a new track is added to the end of the list of existing tracks.

The new track is given a unique name that starts with ***T*** and ends with a number which is unique from all other existing tracks. The track is displayed with a control section on the left side and a timeline display on the right.

![Track Control Section](./images/TrackControl.png)

The control section displays the name of the track and provides several track level functions:
* **Delete** - A track may be deleted by clicking this button. A track delete confirmation screen is displayed requesting confirmation of the deletion. 

  ![alt text](./images/ConfirmTrackDelete.png)

* **Rename** - A track may be renamed as long as the new name is different from existing track names. 

  ![alt text](./images/RenameTrack.png)

  The new name for the track must be different from all other existing tracks. If it is not, a message will be displayed at the bottom of the rename panel. The panel can be dismissed by clicking the <span style='color:lightblue'>x</span> at the upper left hand corner of the panel.</p>

* **Solo** - A track may be soloed when previewing or recording. All tracks that are soloed are played together and others are ignored. A track is taken in and out of solo each time the button is clicked. The track solo setting is ignored when a timeline interval is active. See the Section on the [Timeline Interval](#timeline-interval) for more details.</p>

* **Mute** - a track may be muted when previewing or recording. A track is muted or un-muted each time the button is clicked. When a timeline interval is active, this setting is ignored.

* **Move Up** - When this button is clicked, the track is moved above the track immediately above it. The upper most track cannot be moved up.

* **Move Down** - When this button is clicked, the track is moved below the track immediately below it. The lowest most track cannot be moved down.

* **Add Generator** - When this button is clicked, a menu is displayed providing a list of generator type that can be added to the track. The initial name of the generator is unique to all generators in the file. See [Editing Generators](#editing-generators) for more details about adding and editing generators. 

# Generators
Each generator is placed on a track at its start time and extends to its stop time. The name of a generator must be unique within the CMG file to which is belongs. A visual example of tracks and generators is shown in the example above.

In this figure are shown tracks, each of which has zero or more generators. All of the tracks, except the last, have been renamed and their names are unique. All of the other generators are of the ***Algorithmic*** type.

## Editing Generators

Generators are the heart of CMG. There can be as many generators in a CMG file 
as is needed to produce the composition desired. There are three types of generators: one silent and two sound producers.

The ***Algorithmic*** generator type uses SoundFont presets. Each preset has a bank, channel number, and name. More information about SoundFont presets can be found in the [SynthFont[1] tutorial, part 6](https://www.synthfont.com/Tutorial6.html).

## Generator Types

### **Silent**
The silent generator contains the name of the generator, its type (*Silent*), and its start and stop times. No sound is created by a silent generator. It can be used to offset the start of a composition or extend the ending to allow reverberation to die down.  

The figure below shows the panel for adding a new Silent generator. There is an **Add** Button. When a generator is modified, the button is displayed as **Modify**. Add and Modify functions may be canceled by clicking the ***x*** in the upper left-hand corner of the panel or by clicking the **Cancel** button.
![alt text](./images/SilentEdit.png)
The fields below are common to all generator types.
* **Name:** The name of the generator must be unique within all generators in the file. When a new generator is created the default name is a 'G' followed by a unique number. 
* **Start Time:** This is the time that the generator will start, in seconds, It must be greater than or equal to zero. When the start time is changed, the stop time is automatically changed to maintain the original duration.
* **Stop Time:** This is the time that the generator will stop. It must be greater than the *Start Time*.

Each generator edit panel has a ***Preview*** button that can be used to preview the sound of the generator. In the case of a *Silent* generator, no sound will be produced.

### Algorithmic 
When the generator type of *Algorithmic* is added or one is edited, the Add/Edit panel for that type is displayed:
![alt text](./images/AlgorithmicEdit1.png)
This figure illustrates the initial display when a new Algorithmic generator is being added. Note that the algorithm assigned to note, attack, speed, duration, volume, and pan is ***Constant*** and all values are zero except duration which defaults to 100%.
The fields and their restrictions are defined as follows: 

* **SoundFont File:** Each Algorithmic generator may have a different SoundFont file. SoundFont files contain sample-based synthesized sounds that are most frequently used by MIDI (Musical Instrument Digital Interface) devices. There are hundreds of SoundFont files existing today. This application has a small collection of them available. More can be added as desired. It is selected from the list of those available using the selection pulldown:

  ![SoundFont File Selection](<./images/SoundFont Selection.png>)

  More information about SoundFont files can be found in [Wikipedia](https://en.wikipedia.org/wiki/SoundFont).
* **Preset:** This is a selection list that identifies which SoundFont preset is to be used by the generator. No preset is available until the SoundFont file has been identified. The presets display their bank, channel number, and name. Only presets available within the SoundFont file can be selected. A SoundFont file and preset must have been selected before an Algorithmic generator can be added.
* **Looping:** Instrument samples contain sounds that are produced for a certain amount of time. If the sound needs to be played for longer than the sample, then a sample loop is defined. This is part of the SoundFont protocol. This option allows the default behavior to be overridden such that no looping will be done. 
* **View Preset** - This button is used to view the details of a preset and a specific midi number, attack, interval, duration, and volume. The number of samples, playback rate, delay, attack, hold, decay, sustain release times, and the sustain level and attenuation can be viewed for each instrument in the preset. The gain envelopes for all of the instruments in the preset also appear. 
![Preset Dialog](<./images/PresetDialog.png>)
* **Frequency<->Midi** - This button provides a tool to convert between tone frequency and midi number. 
* **Rhythm** - The beat of the sequence of notes (tones) is determined by a [Euclidean Rhythm](https://en.wikipedia.org/wiki/Euclidean_rhythm) algorithm. The beats that are silent will cause a note to be not heard on that beat. For example, a rhythm that has 4 beats in a measure with 3 of them on will produce a 3/4 rhythm with the first 3 'on' and the last one silent. This is particularly useful when applied to percussive voices, but can be applied to any voice. Rhythm is defined by the following fields:
  * **Measure Length:** The number of beats in a measure. This is an integer greater than zero.
  * **On Beats:** The number of non-silent beats in a measure. This number must be greater that zero and less than or equal to Measure Length.
* **Notes in Octave:** This is how many notes to be used within an octave. The actual notes are determined by a Euclidean Rhythm algorithm where the larger number is 12. For example, if the number of notes in an octave is 7, the notes selected are (0, 2, 3, 5, 7, 8, 10). If primary note is C, the notes to be used in the octave are C, D, D#(Eb), F, G, G#(Ab), and A#(Bb). When a note is generated by one of the algorithms described below, it is moved to the closed selectable note in the octave. If the notes in the octave are set to 12, then all notes are selectable. 
<a id="randomseed"></a>
* **Noise Seed:** The is a character string that is used to seed the random number sequence for Gaussian noise. It defaults to the 'seed', which is not a particularly good value and should be changed. Each of the generators has its own seed. This can be the same as another generator if it is desired to have the generators Gaussian noise sequences coupled. See [this](https://stackoverflow.com/questions/16801687/javascript-random-ordering-with-seed) for a good discussion on generating random numbers.
* **Noise Frequency:** [Gaussian noise](https://en.wikipedia.org/wiki/Gaussian_noise) can be applied to the generated notes as frequency modulation noise. The noise frequency is added to the original note's frequency and then combined with the original signal. 
* **Noise Amplitude:** This is the gain of the noise. A value of 1 means the noise and the original note have the same volume. 
* **Reverb Duration:** The preset experiences reverberation that has duration and decay. This is the duration component, in seconds.
* **Reverb Decay:** This is the decay component of preset reverberation, in seconds. Both duration and decay must be nonzero to have reverberation applied.
    
The values of the sound attributes can be determined by one of three algorithms. These algorithms are discussed below.
  * Note - This determines which note is to be used from the selected SoundFont preset. Sometimes call the midi number, a note may be fractional so that it lies between two integer midi numbers. 
  * Attack - This defines the preset velocity representing how fast a key was pressed. Higher velocities cause instruments to be added to the preset that have rapid attack profiles. 
  * Speed - This determines the rate at which notes will be played. It is expressed in beats per minute (BPM). 
  * Duration - This is used to introduce a staccato effect to a note. Any value less that 100% will cause the note to be shortened during its performance period.
  * Volume - The volume of a selected note is expressed in decibels (dB) relative to the original sample level. Every dB reduces or increases the signal level by 2. 
  * Pan - The sound of the note can be panned left (-1) and right (1). Zero (0) is the pan center.

Each of the note, attack, speed, duration, volume, and pan attributes must have an algorithm assigned. The initial value is *Constant*; however, this must be changed to one of those listed below. The figure below shows an example of an Algorithmic generator that has different algorithms assigned to the attributes. 
![alt text](./images/AlgorithmicEdit2.png)
>>><div class="note">*Note: Midi numbers range from 0 to 127 and correspond to tones of C0 to G9 from the Acoustical Society at https://acousticalsociety.org/. When a midi number is entered, its note name is displayed next to the entry box. Fractional numbers may be entered. For example is 60.5 is entered the note name is displayed as *C4+50*</div>
The algorithm types are as follows:
* **Oscillator**  
  * **Modulator:** This is the type of oscillator used to modify the attribute over time. It can be either *Sine*, *Square*, *Triangle*, *Descending Sawtooth*, or *Ascending Sawtooth*. 
  * **Center:** This is the center value about which the attribute is oscillated. 
  * **Frequency:** This is the frequency of the oscillator expressed in *mHz*. The frequency must be between 0 and 1,000,000 in steps of 1.
  * **Amplitude:** This is amplitude of the oscillator in attribute units. For example if the note algorithm is Oscillator, the amplitude is 6, and the center number is 50, then the generated midi numbers will vary from 44 to 56 over time. If the amplitude is 0, then the center value is generated at all times.
  * **Phase:** This is the phase of the FM oscillator expressed in *degrees*. The phase must be between -360 and 360 in steps of 1.
* **Markovian** 
  This generator creates a [Markov Chain](https://en.wikipedia.org/wiki/Markov_chain) the attribute using a three states with transition probabilities
  The states are  
    * keep the same value 
    * move the value up 
    * move the value down 

    The transition between states in illustrated here

    ![alt text](./images/statetransitions.png)

    Each sequence is bounded by a lower and upper limit and each move is done with a given step size. When an attribute hits an upper or lower limit, the value is reversed. For example, if pan is already at its upper limit (1 or right) and the suggested value is to move further up (right), the value is changed to move down (left). Thus, the containment walls are not 'sticky'.

    The transition probabilities from one state to the itself and the others must be between 0 and 1 and add up to 1. If the transition probabilities are such that the same state is never left, the attribute value will always be its starting value.

  * **Seed:** This is a character string that is used to start the random number sequence for this generator. See [this](#randomseed) for further discussion about random seeds.
  * **Start Value:** This is the value where the sequence of values for attribute starts. It must be between *Lo* and *Hi*.
  * **Lo:** This is the lowest value that can be assigned to the attribute. It must be smaller than the hi value.
  * **Hi:** This is the highest value that can be assigned to the attribute. It must be larger than the lo value.
  * **Step:** This is number to add or subtract from the current attribute to determine the next value when a state is changed. It must be less than or equal to the difference between *range hi* and *range lo*.

  The rest of the fields define state transition probabilities between the various states of the Markov Chain for the attribute. At any time, an attribute has a specific value. When it is time to obtain a new value, a transition from one state to the next is determined by drawing a random number. Each of the 9 transitions may have a different value but the sum of the three transitions out of a state and into another must sum up to one and each must be less than or equal to 1 and greater than or equal to 0. The figure below illustrates a example of the note attribute value will never stay at the same value and will have a probably of 0.5 of going either up or down.
  ![alt text](./images/MarkovianExample.png)

* **Wiener** This generator uses the [Wiener Process](https://en.wikipedia.org/wiki/Wiener_process) to create a random walk or Brownian motion of the attribute. It starts at some value and randomly walks with a trend and dispersion at each beat. A zero trend will keep the random walk centered around the initial value. A negative trend decrease the value over time, and a positive trend increases the value. The dispersion affects how far from the trend line the value will be. Dispersion increases over time.

  * **Seed:** This is a character string that is used to start the random number sequence for this generator. See [this](#randomseed) for further discussion about random seeds.
  * **Initial Value:** This is the value where the sequence of values for attribute starts. It must be between *Lo* and *Hi*.
  * **Trend:** This is the rate at which the average value of the attribute walks away from the initial value. It is in 1/seconds. For example, if the trend is 1, then the average value of the attribute will increase by one each second. If the trend is zero average value is the initial values. Trend may be negative
  * **Dispersion:** This is the amount of dispersion in the random walk. It is in the rather strange units of 1/sqrt(seconds). If dispersion is zero, only a trend will occur. 
  * **Lo:** This is the lowest value that can be assigned to the attribute. It must be smaller than the hi value.
  * **Hi:** This is the highest value that can be assigned to the attribute. It must be larger than the lo value.


* **Autoregressive** This algorithm uses a first-order [Autoregressive Model](https://en.wikipedia.org/wiki/Autoregressive_model) to create a series of values with some persistence. The next value in the series is determined using weighting the previous value and adding a uniformly distributed random number.

  The autoregressive model has the following inputs:

  * **Seed:** This is a character string that is used to start the random number sequence for this generator. See [this](#randomseed) for further discussion about random seeds.
  * **Initial Value:** This is the value where the sequence of values for attribute starts. It must be between *Lo* and *Hi*.
  * **Alpha:** The value of $\alpha$ in the formula above
  * **Dispersion:** This value of $\sigma$ in the formula above. 
  * **Lo:** This is the lowest value that can be assigned to the attribute. It must be smaller than the hi value.
  * **Hi:** This is the highest value that can be assigned to the attribute. It must be larger than the lo value.

  The values are restricted to the *lo-hi* interval.

### AudioFile.
This is not really a generator as it will play a saved audio file rather than generate a new sound. The user specifies the start time of the playback and its volume. The entire audio file is then played from beginning to end. A good use of an audio file generator is to build up a new composition from the recording of other compositions.  
- **Volume:** This is the volume at which the audio file will be played back. It must be between 0 and 10 with a step size of 1. The default value is 5.
- **Audio File:** All files are displayed and the one selected will be read. If it is not an valid audio file, at error message will be display and the file will not be loaded. The stop time an the information about the audio file (sample rate, duration, and number of channels) is not updated until the volume is changed or the next time the generator is viewed.
![alt text](./images/AudioFileGenerator.png)

<a id="GeneratorPulldownMenu"></a>
## Generator Pulldown Menu

Each generator has a pulldown menu that is activated by clicking on the name of the generator in the track timeline display. The following functions are available:

* **Preview** - The sound created by the generator may be previewed on its own without hearing any other generators. The sound will start as if the generator had been defined to start a time 0 (the start of the composition). See [Preview](#Previewing) for more details.
* **Edit** - A entry panel is displayed containing all of the values of the fields for the generator. All fields can be modified. If the *Delete* button is clicked a confirmation panel will be displayed before the deletion occurs:
>>>![alt text](./images/confirmgeneratordelete.png)
* **Copy** - A panel is displayed providing the means to copy the selected generator to any of the existing tracks. The default is the track where the generator currently lies. A new generator is created with all of the same values as the selected generator, except a unique name is assigned to it. The panel may be exited by either clicking *Cancel* or the *x* in the upper left hand corner of the panel. 
>>>![alt text](./images/copypanel.png)
* **Move** - A panel is displayed providing the means to move the selected generator to any of the existing tracks. The default is the track where the generator currently lies. The panel may be exited by either clicking *Cancel* or the *x* in the upper left hand corner of the panel.. 
>>>![alt text](./images/movepanel.png)
* **Mute/Un-mute** - A generator may be muted or un-muted. This affects whether or not it will be heard during Preview or Record. When a generator is muted, its name and type in the track is displayed in <span style='color:red'>red</span>. 
* **Exit** - The generator pulldown menu is hidden.

## Moving a Generator Within Its Track
### Vertical Movement
Each generator is displayed as an icon with its length determined by its start and stop time and the current timeline settings. Its height is 1/3 of the height of the track timeline display. A generator icon may overlap other icons on the timeline display so it may be desirable to move it away from the others. A generator may be moved vertically up or down by clicking anywhere in the icon except the title and dragging the mouse up or down. When the mouse is released, the icon assumes its new position. This position is part of the generator's properties and is saved in the CMG file.
### Horizontal Movement
By click/drag either end of the generator icon, the timing of the generator can be moved. This will change the start and stop times such that the generator will maintain its duration. 

# Timeline

## Timeline Control
The Timeline is a window into the time frame of the full composition. It can be scrolled and zoomed as desired to best display the generator icons as a composition be being constructed. The figure below is an example of a timeline with the controls display on the left side and the time scale shown to the right. 
![alt text](./images/timeline.png)
The following buttons are available to control the time line display:
* **Scroll** - The timeline can be scrolled either left or right by clicking the left arrow or right arrow buttons in the timeline control area. The timeline cannot be scrolled left further than time zero and right further than several years.
* **Zoom** - The timeline can be zoomed in or out to reveal more or less detail by clicking the zoom in or zoom out buttons. The zoom function has both maximum and minimum zoom levels. Each zoom roughly doubles or halves the resolution of the timeline. The time values and tick marks are displayed appropriately to the zoom level in hours, minutes, and seconds.

The scroll and zoom functions of the timeline control how the generator icons are seen. Each generator has a start and stop time which may or may not be with the currently displayed timeline. Only part or none of the generator icon may be seen at any particular timeline setting.  

## Timeline Interval
One of the filters for previewing and recording is the timeline interval. This filter defines which generators are selected and overrides the other filters of muting or soloing of tracks and generators. A timeline interval has a start and end time. Generator whose start and stop time fall with the timeline interval are selected. 

A timeline interval is defined by mouse actions within the timeline. When the mouse moves into the timeline, the cursor changes to an *crosshair* cursor indicating that an interval can be defined. If there is a interval defined, the cursor will change either to a *grab* cursor or a *ew-resize* cursor depending on whether the mouse of within an displayed interval or on one of its edges.

This figure illustrates a typical timeline interval with three selected generators.

![alt text](./images/timelineinterval.png)

- **Defining a timeline interval** This is initiated when a *crosshair* cursor is displayed. Clicking the mouse button and dragging either left or right will define a new interval. When the mouse button is released the interval becomes fully defined and the generators contained within it are highlighted. A defined timeline may be removed by clicking anywhere on the timeline except within the existing timeline.
- **Moving the timeline interval** When the mouse is within the interval and the 'grab' icon is display. A left mouse click with a drag left or right will move the interval. Once the mouse is released the new position is finalized and the generators contained within it are highlighted.
- **Moving the start or end of the timeline interval** When the mouse is moved over either the start or end of the timeline interval, an *ew-resize* cursor is displayed. A left mouse click with a drag left or right will move the selected end of the interval. Once the mouse is released the new end point is finalized and the generators contained within the interval are highlighted.

# Room Level Functions
During the rendering of a generated sound composition, all of the sources from all of the active generators are pulled together to allow for the room level audio modulators of volume, reverberation, compression, and equalization to be applied. These modulators are applied to all of the source sources as an aggregate. The parameters of the room level functions are part of the composition definition and are saved so they can be loaded later. The room level controls are located in the right hand corner of the screen. Their values are set by the use of sliders. Reverberation, compression, and equalization may be disabled.
![alt text](./images/roommodulators.png)

## Room Volume

The volume slider affects the final volume of the generated sound. The slider has a default value of 0, indicating the no addition gain is applied. It ranges from +5 dB to -5 dB in steps of 1. Positive values increase the volume, while negative values decrease the volume. 

## Room Reverb

Room reverb a two types of controls: diffuse sound sliders and early reflections sliders. 

The diffuse sound generates a reverb effect that occurs for a certain duration (0 to 10 seconds) and linear decay time (0 to 10 seconds).

There are three early reflection effects, simulating a left wall (LW), a right wall (RW) and a ceiling. Each has a single delay of the sound of a specified number of milliseconds (0 to 1000) with a certain signal left relative to the original sound (0 to 1).

The Room Reverb may be reset to default by clicking the room reverb reset button.

## Room Compressor 

The compressor is a [DynamicsCompressorNode](https://developer.mozilla.org/en-US/./Web/API/DynamicsCompressorNode). 
There are five controls to the compressor:
- **Threshold** The decibel (dB) level where the compressor will start taking effect. The threshold default is -24dB and has a range of -100dB to 0dB. 
- **Knee** The dB level representing the range above the threshold where the curve smoothly transitions to the compressed portion. The default value is 30dB and the range is 0dB to 40dB.
- **Ratio** The change, in dB, needed in the input for a 1 dB change in the output. The default value is 12 and the range is 1 to 20.
- **Attack** The time, in seconds, required to reduce the gain by 10 dB. The default value is 3 ms and the range is 0 ms to 1,000 ms.
- **Release** The time, in seconds, required to increase the gain by 10 dB. The default value is 250 ms and the range is 0 ms to 1,000 ms.

The amount of *reduction*, in dB, currently being applied to the signal appears in the compressor title line during preview.

The compressor values may be reset to defaults by clicking the compressor reset button.

## Room Equalizer
The equalizer has 10 frequency band filters, roughly spaced 1 octave apart. The lowest band is a *lowshelf* filter. The highest band is a *highshelf* filter, and the remaining 8 are *peaking filters*. The *Q* value for the peaking filters is defined as the ratio between the frequency of the filter and the next higher filter, which is roughly 2. 

The frequencies of the equalizer are not adjustable, but the gains are. They may be varied from -15 to +15 by moving the gain slider. The default values for all filter gains is 0, which can be restored by clicking the equalizer reset button.

The equalizer values may be reset to defaults by clicking the equalizer reset button.

# Previewing, Recording, and Reporting
The whole purpose of this application is to produce sound from the defined generators. This is accomplished using the Preview and Record menu options on the *Play* menu. The options are only active when there is at least one generator defined that can produce sound.

<div class="note">*Note: When in preview mode a Preview window is displayed, which disables all composition function except the room reverb, compressor, equalizer, and volume until the preview is stopped or completed. When in record mode, a popup appears to show the progress of the recording. It may be stopped prematurely if desired. </div><br/>

Generator selection occurs by evaluating some filters:
- **Timeline Interval** If a timeline interval is defined, only the generators that are selected by the timeline will be previewed or recorded. The time of the preview or record is started at the start time of the earliest selected generator.
- **Active Generators** Tracks may be soloed or muted and generators may be muted. All of the tracks and generators are checked for these conditions. If a track is both muted and soloed, solo takes precedence. 

>>>If there are no generators that pass these tests a panel is displayed:
![alt text](./images/nogenerators.png)

## Recording

When the *Record* button is clicked, you will be prompted to provide a file name and location where the result audio file will be placed. The audio file may be either a WAV or a MP3 file. Once that has been identified, the selected generators are rendered and the wave file is written. 

A progress bar is displayed while the recording is being constructed. 

## Previewing

When the *Preview* button is clicked, a preview window is displayed so that the sound sources produced by the selected generators can be seen. Below is an example of a preview window when *Preview* is first selected.
![Preview Window](./images/PreviewWindow.png)
This window has three sections:
- Header: The application logo, a set of buttons, the application name, version, and file, the left and right volume monitors, and the time line are displayed here. The initial set of buttons are ***Exit*** and ***Start***. Exit will terminate the preview and return to either the main composition panel or the generator dialog, depending on how Preview was invoked. When Start is pressed, it is replaced by a ***Pause*** button. Pressing the Pause button will cause it to be replaced by a ***Resume*** button. Pressing the Resume button will resume the preview and display the Pause button again.
- Body: Up to three sections may appears in the body - Instruments, Percussions, and AudioFile. Each section's scale is derived from the range of values that the notes of the sources can take. The lower left hand corner display the section name and the minimum value on the scale, while the upper left hand corner displays the maximum value of the scale. In the case of the percussion section, the notes each correspond to a different percussion instrument as per Soundfont2 rules. The instrument and percussion sections also have dashed lines that represent the integer midi numbers. A bolder dashed line indicates a C note.
  
  Within each section the sources are displayed. The vertical location corresponds to its note value, while its horizontal extent is determined by its start time and duration. The color is such that the hue is based on the pan location, the saturation is based on its volume, and its lightness is based on whether or not it is current producing sound. See the figure below for a close up of a preview that has been paused with some sources currently producing sound. 
  
  ![Zoom Preview](./images/PreviewWindowZoom.png)

  If a generator is previewed by selection of generator preview option, or generators are selected via the timeline interval, the generators' start times are moved such that the earliest start time is at zero. This avoids waiting until the generator would normal start before it is heard.

  When previewing, the current time of the soundtrack is shown by a moving <span style='color:red'>red</span> vertical line on the timeline. This line advances are time progresses. The time line pans right to maintain the current time in the window.
- Footer: The number of total and active sources and generators are displayed in the footer along with the left and right channel spectra, and the room sound controls. Any of the room sound controls may be modified during preview in order to hear their effect.

## Reporting
A report of the composition can be produced using the **Report...** button of the **Generate** menu. This report, in HTML format, provides the specific details of the file, all of its tracks, and all of its generators. The sources produced by each generator is expanded. This detail is provided for each generator, and then for all generators in start time sequence. 

# Glossary
The definition of many of the terms used in this manual can be found online, particularly at [Wikipedia](https://en.wikipedia.org/wiki/SoundFont). 
| Term | Meaning |
| ----------- | ----------- |
| SoundFont File | SoundFont files contain sample-based synthesize sounds that are most frequently used by MIDI (Musical Instrument Digital Interface) devices. More information about SoundFont files can be found in [Wikipedia](https://en.wikipedia.org/wiki/SoundFont). |
| MIDI Number | Musical Instrument Digital Interface (MIDI) continuous control number (CCN). A values used to select which sample from a preset is to be used by a generator.  |
| Preset | A SoundFont preset is a collection of instrument samples that are used to make up the a sound. Presets are identified by a bank number, a channel number, and a name. CMG only uses the first instrument in a preset collection of instruments to produce sound. |
| Markov Chain | This may be used by the Algorithmic generator for one or more attributes and is best described by [Wikipedia](#https://en.wikipedia.org/wiki/Markov_chain) |
| Sound Compression | Audio Dynamic Range Compression, not to be confused with Data Compression is best described in [Wikipedia](#https://en.wikipedia.org/wiki/Dynamic_range_compression) |
| Sound Equalization | This is best described by [Wikipedia](#https://en.wikipedia.org/wiki/Equalization_(audio))  |
| Low Shelf filter | This is best described by [Wikipedia](#https://en.wikipedia.org/wiki/Filter_design) |
| Peaking Filter | This is a band-pass filter as defined by [Wikipedia](#https://en.wikipedia.org/wiki/Band-pass_filter)  |
| High Shelf Filter | This is best described by [Wikipedia](#https://en.wikipedia.org/wiki/Filter_design) |
| Q Value | This is parameter os a band-pass filter as defined by [Wikipedia](#https://en.wikipedia.org/wiki/Band-pass_filter) |
| Weiner Series | This is used by the Algorithmic generator to determine values for one or more of the attributes. The series is described in [Wikipedia](https://en.wikipedia.org/wiki/Wiener_series). |
| Euclidean Rhythm | This is used by the Algorithm generator to create [Euclidean Rhythm](https://en.wikipedia.org/wiki/Euclidean_rhythm) patterns and to select notes from the 12-note scale. |
