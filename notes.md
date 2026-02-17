
# Bugs
- WATCH: after a play, menus do not work and time interval don't work
- no notification when dbserver is not accessible
- there is a jump when play first gets started
- when a note sequence is reloaded, the duration of the generator should be recalculated.
- when previewing in the generator dialog, changes made to the parameters are lost after the preview. Somehow the dialog has to be reactivated after a preview with these changes but not update the fileContents with the formData. This is a result of the use of the .copy() method which signals a change similar to the stop time calculation method above
# Enhancements
- add vibrato objects to play image
- change cursor to spinning when busy. tried but failed :-( 
- implement microtone option in both algorithmic and stochastic generators. 
- pipe dream - add a video producer that takes hints from the composer and does drawings based on the sounds and those hints. See the ChatGPT chat on scribble for some guidance on structural hints from the composer. 

# things to do
- update documentation
- add measure timing and use measure length as beats/measure in sequencer algorithm. Use preferences as default when sequencer selected. On beats stays as is.
- measure lengths are not constant in time when the speed attribute is changed. Now, I have a measure length in seconds in preferences and that is what is used to draw the timeline. This is incorrect and in fact I'm not sure that the conversion from time to measures makes sense when generators can all run at their own speeds. The sequencers conversion is particularly bad. Maybe I should abandon measure display and data entry unless I can think of a solution. (haven't thought of one yet)

# 6.0.0 Updates
- add ctrl+n to open recent files
- added a microtone option to algorithmic and stochastic generators. 
- implement the 'play' function, replacing the preview and record functions
- added the Stochastic generator
- added button to generate random seeds for noise, algorithms, and stochastic compositions
- implemented tremolo and vibrato for algorithmic generators
- implemented sequencing, including reversing and reflecting
- added a generator flag to bypass the attack envelope as an option. The attack part of the envelope seems to be overemphasizing signals that already have a lot of attack in them.
- rebalanced the various gains used throughout the application
- added an option to start the CMG Sequence Editor to the Tools menu
- added insert, move up and down actions to the sequence editor item list.
- added a feature to start the client by clicking a .cmg file in Windows Explorer

# things to know    
for match conditional statements in HTML
/\{g\.(.*)\?.*\n(.*).*\n.*\).*/

<li align="left">
the only way I know to imbedded an icon in text 
  <img src="./docs/images/icons/edit.svg" width="20px" height: auto; alt="description">
  is this way
</li>

# React Icons Used in CMG
The following React Icons are used throughout the application:

## Timeline Controls
- **CiPlay1** (Play) - Start playback
- **CiPause1** (Pause) - Pause playback  
- **CiStop1** (Stop) - Stop playback
- **CiFastForward** (Fast Forward) - Speed up playback
- **CiRewind** (Rewind) - Rewind playback

## Track Controls  
- **AiFillDelete** (Delete) - Remove track
- **AiOutlineEdit** (Edit) - Edit track properties
- **CgRename** (Rename) - Rename track
- **IoPerson/IoPersonOutline** (Person) - User/person indicator
- **FaTools** (Tools) - Access tools menu
- **RiAiGenerate** (Generate) - AI generation functions

## Navigation
- **GoArrowLeft** (←) - Navigate left/back
- **GoArrowRight** (→) - Navigate right/forward  
- **GoArrowUp** (↑) - Navigate up

## Processing
- **PiEnvelopeThin** (Envelope) - Envelope processing


# Sound/Somposition realization 
what I like to see is a single way to 'play' a composition. The component would build a video that included the composition
graph and the sound track. This could be saved to a file as a video. I would need a way to strip the sound track from the video for use in other videos.

This might be done by building an animated svg and then converting it to video when a save is done.

The svg window would be sized like a HD video. The horizontal scale would be enough for 1 minute of composition, with time hacks every 5 seconds. the curren time line would be fixed at about 15 seconds form the left edge. 

The user selected 'Play'. this builds the composition graph and the soundtrack. The sound track would be built with the Record component and then merged with the video.

cmg would use a temporary file to hold he video that the user could save 

video would contain source graph, current time hack, spectra, sound levels. 

During play of the video the user would have forward/pause/position control. They could also save the video.

there would be no room level controls

SVG would be animated such that the source chart smoothly scrolls from the start to the end 

Playback of video would show relative position in mm:ss
