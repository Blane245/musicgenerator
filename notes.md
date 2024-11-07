
# offline audio generation and recording

as user for a file to be written to
define a offlineaudiocontext (offlinectx = new (OfflineAudioContext(1, 44100)))
and destination = offlinectx.destination
build the sources from the generators in teh offlinecontext
after all of the sources are connected to this context, provide the start and stop times to the sources from generatortimes
render the offline context (offlinectx.startRendering)
encode the rendredbuffer to wave format and write to user-selected file

# simplereverb node connect sequence
filter input -> filter effect -> filter output

compressor -> destination

filter output -> reverb input -> reverb gain -> reverb convolver -> reverb output -> compressor

wetsound -> filter input

# reverb tail connect sequence

amp output -> voice output

oscbuffer(started) -> amp output

noise ouptut -> offinecontext
