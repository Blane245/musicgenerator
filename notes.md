TODO
* ? open file starts up with no track reference for generator icons
* added generator not displayed until timeline is changed, when file is opened, when track is renamed
* save and load file need cmg type 
* generator menu remains on a click away
* do a decay at the end of a generator to stop the 'clicking'
* add progress on timeline rather than a popup (sort of works)
* implement keyboard short cuts
* when the soundfont file is changed, map the existing presets to the same bank and 'preset'
* The track timeline is not displaying the generators until the timeline is zoomed in or out. It should update whenever a change occurs including initial file load.
* add a play recording button

done
* implement generator copy function - allow track selection
* generate sometime repeats sequence
* SFPG and SFRG presets must be modified on an add for validation pass
* delete generator not working properly. icon remains on track timeline
* need to be able to seed the random number generator to get the same sequence each time
* have 'record' done as quickly as possible, not in real time (building the buffer offline still requires a realtime recording. approach might be to build an ogg filer and the use a webaudio to play it back or record it to mpg).


# offline audio generation and recording

define a recordcontext (create the ondataavailable and onstop handlers)
define a offlineaudiocontext (offlinectx = new (OfflineAudioContext(1, 20000)))
build the sources from the generators
after all of the sources are connected to this context, start it (source.start())
render the offline context (offlinectx.startRendering)
load the renderedbuffer to a audiosourcenode (const song = new AudioBufferSourceNode(recordcontext, {buffer: renderedBuffer}))
connect the song to the record context (recordcontext.destination)
start the song(song.start())
