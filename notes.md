# Bugs
- getting a lot of popping during stochastic playback of one of the SMW presets. tried an attack ramp of 50ms but no difference
- when a note sequence id reloaded, the duration of the generator should be recalculated.
- when previewing in the generator dialog, changes made to the parameters are lost after the preview. Somehow the dialog has to be reactivated after a preview with these changes but not update the fileContents with the formData. This is a result of the use of the .copy() method which signals a change similar to the stop time calculation method above
# Enhancements
- have separate random sequences for stochastic composition and dynamics.
- display channel signals for stochastic and audiofile preview
- consider using slow time line scrolling during preview
- pipe dream - add a video producer that takes hints from the composer and does drawings based on the sounds and those hints. See the ChatGPT chat on scribble for some guidance on structural hints from the composer. 

# things to do
- add measure timing and use measure length as beats/measure in sequencer algorithm. Use preferences as default when sequencer selected. On beats stays as is.
- measure lengths are not constant in time when the speed attribute is changed. Now, I have a measure length in seconds in preferences and that is what is used to draw the timeline. This is incorrect and in fact I'm not sure that the conversion from time to measures makes sense when generators can all run at their own speeds. The sequencers conversion is particularly bad. Maybe I should abandon measure display and data entry unless I can think of a solution. (haven't thought of one yet)

# 5.0.0 Updates
- added button to generate random seeds for noise, algorithms, and stochastic compositions
- implemented global, track, and generator controls
- implemented tremolo and vibrato for algorithmic generators
- implemented sequencing, including reversing and reflecting
- added a generator flag to bypass the attack envelope as an option. The attack part of the envelope seems to be overemphasizing signals that already have a lot of attack in them.
- rebalanced the various gains used throughout the application
- added an option to start the CMG Sequence Editor to the Tools menu
- added insert, move up and down actions to the sequence editor item list.

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

