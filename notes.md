TODO
* ? open file starts up with no track reference for generator icons
* added generator not displayed until timeline is changed, when file is opened, when track is renamed. looks like a trackref timing issue
* generator menu remains on a click away
* implement keyboard short cuts
* record to wav offline (maybe changed to mpg format)
* try to prevent track updates during rendering
* clear message and status areas on at each interaction
* sometimes generator edit will show CMG type rather than correct one
* sometimes preview does get addressibility on generatorboxes and throws an exception
* SFPG is clicking every chunktime (sample is ending with zero signal level - probably a precision counting problem )
    * the prolemis that some chunktime samples stop early with zero signal level for a few samples 
* add a repeat option to soundfont samples - some presets have bad repeat patterns. Could repeat from beginning as a option (loop repeat, beginning repeat, no repeat)

done
* add progress on timeline rather than a popup (sort of works)
* do a decay at the end of a generator to stop the 'clicking' (didn't work but does softening end transition)
* save and load file need cmg type 
* when the soundfont file is changed, map the existing presets to the same bank and 'preset'
* do a soft release at the end of the each generator so it doesn't abroptly 
* AHHH! whote noise is buggered up
* disable record prevew and generator text when sounds are playing (the screen should be locked while previewing or recording)
* make timeline scroll
* see Onev2 T2, G1 for range problem with midi sine wave (non repeatible)
* refactored tracksdisplay separating trackcontrolsdisplay

# offline audio generation and recording

as user for a file to be written to
define a offlineaudiocontext (offlinectx = new (OfflineAudioContext(1, 20000)))
and destination = offlinectx.destination
build the sources from the generators in teh offlinecontext
after all of the sources are connected to this context, provide the start and stop times to the sources from generatortimes
render the offline context (offlinectx.startRendering)
encode the rendredbuffer to wave format and write to user-selected file
