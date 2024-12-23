# Rambling

This work is inspired by the book [Formalized Music: Thought and Mathematics in Composition](https://en.wikipedia.org/wiki/Formalized_Music). Though the principles in that book are only partially realized here, more work may be done...

The music generator will play one or more voices using various note generators. The generators may be sequences, Markov random walks, or noise. Each voice can be assigned to a sound font file bank and preset.
Voice controls include

- start and stop times
- soundfont bank and preset
- generation algorithms for note midi number, volume, and pan (sine, triangular, square, random walk, stochastic, e.g)
- gain envelop controls (attack, hold, release) these may be changed over time
- Sound generation can be either previewed thru the computer speakers or recorded to a wave file.  

# Sound Generators
All sound generators have a time when its effect starts and stops. A generator maybe be muted.
There are three type of sound generators in this version.
1. A Soundfont Programmed Generator (**SFPG**). This generator creates repetitive sequences of notes using sine, sawtooth, square, or triangular wave forms. Pan and volume have the same repetitive generators. Each waveform have a center, frequency, amplitude, and phase. The waveforms are sampled at a user-provided **interval** and a audio source is generated that starts at that time and ends **interval** seconds later to be followed by another audio source until the stop time for the generator is reached.

    Starting notes are taken from the Soundfont file preset.

2. A Soundfont Random Generator (**SFRG**). This generator creates Markov sequences of notes, volumes, and pans at a speed that is also a Markov sequence. This is a 4-dimensional Markov process where each dimension has three states with probability transitions between each state. The states are  
    * keep the same value 
    * move the value up 
    * move the value down 

    Each sequence is bounded by a lower and upper limit and each move is done with a given step size. The speed dimension controls the time at which each transition in the other dimensions occur. When an attribute hits an upper or lower limit, the value is reversed. For example, if pan is already at its upper limit and the suggested value is to move further up, the value is changed to move down. Thus, the containment walls are not 'sticky'. The number of sources in a SPRG depends on the length of the generator time and the time frame of each random interval. 

    Starting notes are taken from the Soundfont file preset. 

3. A Noise Generator (**Noise**). This generator will create white or gaussian noise from the start to stop time. It is broken up into 0.1 second duration sources for this interval to provide for volume and pan changes to occur during this period. Gaussian noise have a center frequency (Hz) and standard deviation that is applied to the amplitude of the noise. Volume and pan values have center, amplitude, frequency, and phase values and have the same repetitive types as SFPG.

# CMG Data Structure

The data structure is hierarchial:

*  Called *CMGFile*, this includes all attributes that apply to all other attributes. It includes a filename, the room compressor, the room equalizer, the name of the soundfont file and its contexts, and a collection of tracks that contain generators.
* Called *TimeLine*, this includes attributes that define the left most time to be displayed, and the current zoom level. This data element is independent of CMGFile. i.e., time line setting persist between files and are not saved.
* Called *Track*, this is an instance of the track collection belonging to a CMGFile. Each track has name, solo, and mute attributes and a collection of generators. This provides the means by which generators can be assigned to different tracks for organizational purposes.
* Called *Generator*, this is an instance of a generator collection and is the source of the sound that is produced by CMG. There are currently four types of generators.

    * **CMG** - this generator is the parent of sound generators and does not generate sound. It contains the attributes that are common to all generators. This includes a name, start and end times, mute flag, and a vertical position with the track's timeline. 
    * The three types of generators that produce sound are listed above.

# Web Audio Routing Graph

A Web Audio graph is virtualized when a user selects preview or play. The connections are not made until the context time comes that it will need to be played. In either case, the graph is the same, only the audio context destination is changed. The graph is constructed using time line interval selector, the muting and solo attributes of the tracks, and the muting attributes of the generators. A single generator may be previewed.
The following figure illustrates the audio graph using an example where their are an arbitrary number of tracks containing an arbitrary number of generators.

The upper figure focuses on overall structure from the generators to the compressor. The lower figure focuses on the multiple sources of a single generator. A generator can create one or more sources depending on its type and the specified interval or speed.

![Web Audio Routine Graph](AudioRoutingGraph.png)

The upper figure presents those sources, volumes, and pans or a generator as a single box. Each generator group is connected to the room concentrator which has a gain of 1. The lower figure illustrates a generator that creates several sources, applies volume and pan to each source.

The room concentrator gain output is routed to an equalizer, then to a compressor, and to the final destination (either computer speakers or a output stream).

# Application structure

The CMG application provides several features:
1. User definition of the all of the attributes of global generation environment, include Soundfont file selection, room reverb, equalizer, and compressor. A library of Soundfont files is provided for selection.
2. Display of a timeline that can be panned and zoomed, and shows the progress during preview. A interval can be defined that will select generators to be recorded or previewed. 
3. User creation, deletion, and maintenance of tracks including track renaming, solo, and mute
4. User creation, deletion, and maintenance of generators, including all attributes of each generator.
5. Preview and Record functions. During either preview, only the characteristics of the room equalizer, and compressor may be changed. 
6. The ability save and load a defined computer music generation scenario.

The figure below illustrates the class structure of teh application. It is implemented as a Vite client using TypeScript. A webserver is used to access a library of soundfont files.

![CMG Component Diagram](ClassDiagram.png)

The application is designed around the user interface and supported by a context provided. The three parts of the application are the header, body, and footer. 

## Component Structure
Classes are used to define sound generator objects (SFPG, SFR, Noise) that are persisted in files while the user interface and sound generation are implemented through React functions. The general structure of the classes are
1. A set of attributes that define the objects of the class.
2. A *constructor* that requires a parameter to name the object. Other optional parameters may be present.
4. A *copy* function that makes a copy of the current object. This is used to cause React to trigger hooks when one or more of the properties of the object changes.
5. A *setAttribute* function that is called by the object maintenance functions of the user interface.
6. An *appendXML* function that added the objects definition to an XML document to be written to external storage. 
7. A *getXML* function that reads the object from a XML string

## Header

The header is laid out in a grid containing a menu and a controls display. 

The menu has options for starting a new file, opening an existing file, save a file and creating a new track. 

The controls display provide for selection of a Soundfont file from the soundfont file server, manages the time line display pan and zoom, time line interval, and provides for control of the execution of preview and record.

## Body

The body as a scrollable area that holds all of the defined tracks. Each track has a control area and a display area. Track controls include delete, rename, solo, mute, move up and down the track list, and add generator buttons. Track display include 'icons' for each generator defined on the track.

When a generator is created, it has a default type of CMG, which contains the start time and stop time attributes. The type may be changed to SFPG, SFRG, or Noise as desired. If left as CMG, it is a place holder that will not generate any sound.

The generator icons are displayed as rectangles that start and stop at the generator's times and are 1/3 of the height of the track display. This allows for movement on the icon vertically within the track display to reduce overlap. 

These icons have a menu that provides for generator editing, mute, and preview functions. Generators can be deleted through the edit function.

## Footer

The footer includes areas for a status message, equalizer, and compressor attributes. 

## Preview and Record Generation

This is the business end of this application and most of the user interaction function is disabled when in either of these modes. The only interaction allowed is to stop the preview or record, or adjust the equalizer and compressor parameters while previewing. 

Generation has the process:

1. Determine which generators will be used to build the audio routing graph, taking into account all tracks and generator mute and solo attributes. If a generator is running in preview mode, only it is selected.
2. If recording, request the user of the file name and location for the generated **.wav** file
3. Set the audio context based on the preview or record. If in preview, suspend the destination until all is ready to go.
3. Create the room concentrator for this context.
4. Set the context for the room equalizer and compressor, and make the necessary connections from the room concentrator to the compressor to the equalizer to the destination.
4. Build all of the sources for all of the selected generators. For each generator this includes:

    2. Looping through the various 'chunks' of the generator over time

        1. Get the current values for the generator
        1. get the tone or noise sample, and, if a soundfont preset is being used, determine the soundfont generator values that affect each instrument in the preset. These affect the sample and volume attributes.
        1. Create the source for the chunk for that time
        2. Apply the volume and pan values for that time

5. When in preview mode, a portion of the audio graph is constructed for sources whose start times are about to occur using a scheduler. This connects the source, volume, and panner to the room concentrator and starts to source for the appropriate duration. All started sources are then checked to see if their stop time has been past. If so, they are disconnected from the audio graph and removed from source data array. 
6. When in record mode, ... 

# Thanks

Special thanks to various people

- My son, Ryan Lane, that got me into web-based programming
- [sfumato](https://github.com/felixroos/sfumato) - who revealed the complexities of soundfont signal processing
- WebAudio documentation, particularly the authors of the page [Advanced techniques: Creating and sequencing audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)
- Russell Good for his blog [How to Convert an AudioBuffer to an Audio File with JavaScript](https://russellgood.com/how-to-convert-audiobuffer-to-audio-file/)
- Mathew Willox for his blog [Making Reverb with the Web Audio API](https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html)
- Duckduckgo search engine that helped me hack my way through this

# Versions - Changes

Version 2 implements 
1. higher quality sound by using all instruments in a preset and using some of the gain envelope generators from the preset (specifically attack and release). 
2. Performance enhancement by keeping a sample pool to reduce memory utilization and dynamically modifying the audio graph during execution.

## Remaining things to do

- room and instrument reverbs are a dream
- create echo effect
- add a fade out of about 1 second at the end of the piece.

# Development and Installation

## Typescript and Vite build tweaks

I am running a nginx ubuntu server for access to the CMG client. After building the application (npm run build), move the contents of the build folder (dist) to /var/www/lanedb.hopto.org/cmg via scp. The nginx configuration for the path lanedb.hopto.org/cmg is root /var/www/lanedb.hopto.org. The build index file points to /assets/... get the the app. I had to change it to /cmg/assets. Also, the assets directory had to have its mode changed via <code>sudo chmod 755 assets</code>.


