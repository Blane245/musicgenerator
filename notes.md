#Bugs
- have to double click file menu (?)
- the general user flute preset cannot play faster than 180 BPM. It generates silence above that speed. must be something about the attack, sustain, or release. At 200BPM, the repeat rate is 300ms. The flute at midi 72, and velocity of 63, the attack, sustain, and release are 4.8ms, 952ms, and 250ms respectively. There is no delay, hold, or decay.
    - the problem seems to be with the attack time. Other instruments without attack (e.g. piccolo) do not have this problem. 
#Enhancements
- disable delay of a preset. For presets that have multiple instruments, the shortest delay is removed and the other instrument delays are shortened.
- implement a note velocity modulator. Should add some expression to notes
- implement granular synthesis to achieve vibrato, tremelo, glissandi, and other effects
- consider using slow time line scrolling during preview

# A local file server
A local directory/file server running on port 6001 has been written with the follow endpoints:
    - directory/list?name='name'
        - name is the full path name of the directory
        - response is {list: [
            {"type": "directory" | "file"}
            {"name": name of the file or directory without the name of the directory  }
            {"path": the name of the directory (identical to the one in the query)}
            ...],
            "error": nonblank if an error occurred

        }
    - file/read?name='name'
        - name is the fully qualified file name
        - response if {"file: {
            "type": "Buffer",
            "data": [byte array] (must handle binary soundfont files and JSON .cmg files)
        },
        "error": non blank oif an error occurred while reading
        }
    - file/write?name='name'&overwrite='true|false' where the contents parameter of the request is a byte array of the file contents
        - name is fully qualified file name
        - overwrite is 'true' | 'false' depending on whether the file should be ovewritten
        - contents is a byte array of the file contents (does this need to be stringyfied?)

Use cases for local file access include 
    - remember the last directory accessed for cmg, or recordings and use them as defaults when the user 
        selects one of the following action. Update the last directory when the user successfully finishes the
        function
    - navigate from one directory to another (this can get really complicated, so maybe do as enhancement)
    - let the user provide the directory path
    - configure the local soundfont files directory name (default is null, so must be set the first time CMG is used)
        - the prefernces menu
        - abandon the server access to soundfont files
    - get list of soundfont files in named directory (soundfont files have .SF2 or .sf2 types)
    - read a soundfont file and load it into a SoundFont2 object
    - get a list of .cmg files in named directory (for Open and SaveAs)
    - read a .cmg file and load it into a CMGFile object (for Open and Recent)
    - maintain a recent .cmg files list for quick access to previously accessed files
    - save a .cmg file that has been modified (overwrite=true)
    - saveAs a .cmg file. If the file aleady exists, prompt the user to confirm overwrite

#Bugs

#4.0.1 Updates
- fixed error in random number generator
- correct autoregressive current value calculator
- step changes to start and stop time in generator dialog
- CMG now uses internet port 3006 rather than the default of 80.
- A recent Files capability was implemented. This required the services of a file server app running on the local machine on port 6001. Details on how to install and run this server is forthcoming. 
- Preview source duration reflects whether the source is looping or not
- GUI updates to the Generator Add/Modify dialog
- The time line pan and zoom setting are now part of the save composition. 