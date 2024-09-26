export async function requestSaveFile(suggestedName: string = 'untitled.cmg'): FileSystemFileHandle {
    const options =
    {
        types: [
            {
                description: 'CMG files',
                accept: {
                    'cmg': ['.cmg']
                }
            }
        ],
        suggestedName: suggestedName,
    }
    const handle: FileSystemHandle | null = await window.showSaveFilePicker(options)
    return handle;

}

export async function requestOpenFile(): FileSystemFileHandle {
    const options = {
        types: [
            {
                description: 'CMG files',
                accept: {
                    'cmg': ['.cmg']
                }
            }
        ]
    }
    const handle: FileSystemFileHandle[] = await window.showOpenFilePicker(/*options*/);
    return handle[0];

}

