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

4. An Audio File Generator (**AudioFile**). This generator contains the samples from an existing audio file, as long as the web browser audio conversion exists for the audio file type. The start time is controlable, bu the stop time is set based on the duration of the audio file. Only the volume can be adjusted as it is assumed that panning is handled in the file itself. 

# CMG Data Structure

The data structure is hierarchial:

*  Called *CMGFile*, this includes all attributes that apply to all other attributes. It includes a filename, the room compressor, the room equalizer, the name of the soundfont file and its contexts, and a collection of tracks that contain generators.
* Called *TimeLine*, this includes attributes that define the left most time to be displayed, and the current zoom level. This data element is independent of CMGFile. i.e., time line setting persist between files and are not saved.
* Called *Track*, this is an instance of the track collection belonging to a CMGFile. Each track has name, solo, and mute attributes and a collection of generators. This provides the means by which generators can be assigned to different tracks for organizational purposes.
* Called *Generator*, this is an instance of a generator collection and is the source of the sound that is produced by CMG. There are currently four types of generators.

    * **CMG** - this generator is the parent of sound generators and does not generate sound. It contains the attributes that are common to all generators. This includes a name, start and end times, mute flag, and a vertical position with the track's timeline. 
    * The threefour types of generators that produce sound are listed above.

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

The figure below illustrates the class structure of the application. It is implemented as a Vite client using TypeScript. A webserver is used to access a library of soundfont files.

![CMG Component Diagram](ClassDiagram.png)

The application is designed around the user interface and supported by a context provided. The three parts of the application are the header, body, and footer. 

## Component Structure
Classes are used to define sound generator objects (CMG, SFPG, SFRG, Noise, Wiener, Euclidean) that are persisted in files while the user interface and sound generation are implemented through React functions. The general structure of the classes are
1. A set of attributes that define the objects of the class.
2. A *constructor* that requires a parameter to name the object. Other optional parameters may be present.
4. A *copy* function that makes a copy of the current object. This is used to cause React to trigger hooks when one or more of the properties of the object changes.
5. A *setAttribute* function that is called by the object maintenance functions of the user interface.
6. An *appendXML* function that added the objects definition to an XML document to be written to external storage. 
7. A *getXML* static function that reads the object from a XML string

Other function may be available for special needs. 

## Header

The header is laid out in a grid containing, title line,  a menu and a controls display. 

The title line contains the logo, the program name and versio0n, the currently open file name, and a button for adding a comment to a file. 

The menu has options for starting a new file, opening an existing file, save a file, and creating a new track. 

The controls display provide for selection of a Soundfont file from the soundfont file server, manages the time line display pan and zoom, time line interval, and provides for control of the execution of preview and record.

## Body

The body as a scrollable area that holds all of the defined tracks. Each track has a control area and a display area. Track controls include delete, rename, solo, mute, move up and down the track list, and add generator buttons. Track display include 'icons' for each generator defined on the track.

When a generator is created, it has a default type of CMG, which contains the start time and stop time attributes. The type may be changed to SFPG, SFRG, Noise, Weiner, or Euclidean as desired. If left as CMG, it is a place holder that will not generate any sound.

The generator icons are displayed as rectangles that start and stop at the generator's times and are 1/3 of the height of the track display. This allows for movement on the icon vertically within the track display to reduce overlap. 

These icons have a menu that provides for generator editing, mute, and preview functions. Generators can be deleted through the edit function.

## Footer

The footer includes areas for a status message, volume, equalizer, and compressor attributes. 

## Preview and Record Generation

This is the business end of this application and most of the user interaction function is disabled when in either of these modes. The only interaction allowed is to stop the preview or record, or adjust the volume, equalizer, and compressor parameters while previewing. 

While previewing or recording is being done, filters are applied to determine which sources will be used to build the audio routing graph. These filters take into account the presence of a timeline interval, and track and generator solo and mute settings. An array of sources is constructed that contains all of the information needed to construct the audio routing graph.

Generation involves the build of the audio routing graph for the composition. There could be several thousand sources and related audio nodes in the full composition. Trying to realize the entire graph for preview or record is problematic and the memory required may be excessive. A scheme has been developed to only realize a portion of the graph, discard that portion and realize another portion. The algorithm is different for preview and record.

### Preview Realization

1. An audio context is constructed to hold the dynamically changing routing graph.
2. The room level nodes are constructed and connected to the context destination (system speakers). These include a room concentrator with unity gain, and the compressor, equalizer, and volume as defined by the composition. When the sources are placed on the graph they are connected to room concentrator.
3. A scheduler is run that triggers every 25 milliseconds. This scheduler does the following every cycle.
    - All sources that are to be started within the next 100 milliseconds of the current context time, are collected into an array. They are then realized as audio nodes along with their effects, connected to the room concentrator, and started.
    - All running sources that have their stop time prior to the curren time are disconnect from the routing graph.
    - When the current time is before the playback length of the composition, the next 25 milliseconds cycle is initiated. 

While the composition is being previewed, the generators that are playing are identified so that they can be highlighted on the track display.

### Record Realization

Recording involves the rendering of portions of the audio routing graph in blocks, called batches, which are group together to enable simultaneous rendering. As each completes the resulting buffer is added to the total. When all batches are complete, the total is encoded to the selected audio file type, either WAV or MP3. Currently a batch consists of up to 200 sources, and up to 10 batches are dispatched for simultaneous rendering.

Before recording can begin, the user is asked to identify the file that is to contain the encoded audio.

1. The source are sorted in start time order.
2. The result array is constructed for left and right channels and the number of samples making up the entire playback length.
3. The number of batches is counted so it will be known when all batches have been completed.
4. A timer is used to construct up to 10 batches in for simultaneous rendering when the previous group of batches has completed. 
5. When the batches are identified the following occurs for each
    - an offline audio context is created for the batch
    - a copy of the room compressor, equalizer and volume is created and connected to the a room concentrator and offline context destination
    - the sources in teh batch are realized and connected to the room concentrator
    - rendering is started for the context. When complete, the rendered buffer to added to the total, sample by sample. The number of batches completed is incremented.
6. When all batches are completed, the total is encoded to the audio file and the timer is stopped.
7. Another timer is used to update a progress bar than displayed the percentage of buffers completed or the total required. 

# Thanks

Special thanks to various people

- My son, Ryan Lane, that got me into web-based programming and provides a sounding board for problems when I am having them. One of his web sites is a monitor of [his weather station](https://wx.mc-lane.com/).
- [sfumato](https://github.com/felixroos/sfumato) - who revealed to me the complexities of soundfont signal processing
- WebAudio documentation, particularly the authors of the page [Advanced techniques: Creating and sequencing audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques).
- Russell Good for his blog [How to Convert an AudioBuffer to an Audio File with JavaScript](https://russellgood.com/how-to-convert-audiobuffer-to-audio-file/).
- Mathew Willox for his blog [Making Reverb with the Web Audio API](https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html). I have yet to make reverberatio work, but haven't given up on it yet.
- The Duckduckgo search engine that helped me hack my way through this.

# Versions - Changes

Version 3 implements 
1. The Mixed generator, where one, volume, speed, and pan can each be a different algorithm.
1. Higher quality sound by using all instruments in a preset and using some of the gain envelope generators from the preset. Full use cases for delay, attack, hold, decay, sustain, and release have been implemented.
2. Performance enhancement by keeping a sample pool to reduce memory utilization and dynamically modifying the audio graph during execution.
3. Overall room volume control.
4. User interface improvements.
5. Implementation of the Weiner and Euclidean generators
6. Refinement of he screen layout to accommodate different size monitors.

## Remaining things to do

- room and instrument reverbs are a dream
- create echo effect

# Development and Installation

This application was developed in Visual Code, using a vite/typescript project.

## Typescript and Vite build tweaks

While TypeScript goes a long way towards making JavaScript strongly data types, there is still some work that is needed. I had to have typscript compiler ignore a few lines that it was having trouble with using // @ts-ignore

Note to self: The base for the build is set to /cmg.
I am running a nginx ubuntu server for access to the CMG client. After building the application (npm run build), move the contents of the build folder (dist) to /var/www/lanedb.hopto.org/cmg via scp. The nginx configuration for the path lanedb.hopto.org/cmg is root /var/www/lanedb.hopto.org. The build index file points to /assets/... get the the app. I had to change it to /cmg/assets. Also, the assets directory had to have its mode changed via <code>sudo chmod 755 assets</code>.


