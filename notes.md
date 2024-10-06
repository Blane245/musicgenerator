# various transactions to CMFIle
in all cases, the dirt bit is to be set
## CMFile Level
* new file (FileMenu) 
** parameter new file contents
## Control dialog
* load SF file
** parameter fileName, sf object
## Track level
* add new track (TrackMenu)
** parameter track to push on tracks collection
## Tracks display
* delete track
** parameter trackIndex
* rename track
** parameter index, newName
* flip mute or solo
** parameter index, attribute
* move track up or down
** parameter trackName, direction
## Generators
* flipGeneratorMute
** track, index
* moveGeneratorBodyTime
** track, index, newStart
* moveGeneratorBodyPosition
** track, index, newTop
* moveGeneratorTime
** track, index, mode, newValue
* add generator
** track, formData
* modifiy generator
** track, formdata, oldName
* delete generator
** track, name


