cleanup
- audiofile generator add/modify not updating meta data until another change occurs 
- generator icon menus having problems scrolling
- implement reverse sawtooth oscillator
- add volume envelop display values to generator dialog as popover. Output in gain and seconds.

- implemented this release
    - documented volume processing
    - relinked soundfont2 to local version, uninstalled soundfont2
    - implemented initialAttenuation soundfont generator
    - tweaked healp menu
    - implemented generator move function
    - implemented quick preview in generator dialog
    - implemented option to load soundfonts from project directory or server (a bit buggy)

soundfont file location preference processing

Assume that the local and server soundfont files with the same name have the same presets, etc.

Based on this assumption, files loaded into the pool are retained there whereever they came from

Need to guarantee that there is a file list available to the algorithm dialog, and that the selected file is in the list. 

- at startup, get the soundfont file local preference from local storage - default is server
 - preferences.. Edit menu item. User can select local or server. When selected, the new file list is loaded. Check the all generators are using files from this new list. If not, alert an error and revert the preference and file list to their previous values. All's well - update localstorage.
 - file open - load the soundfont file list if not loaded. A problem here is that the SF file may not exist in the current location and the load will abort.
 - file new - load the soundfont file list if not loaded
 - startup has a new file and no soundfont file list, so in the algorithm dialog, load the soundfont file list if it has not been loaded

 