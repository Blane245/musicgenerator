// provides CRUD for all types of generators
// All Generators have
//  Name
//  StartTime
//  EndTime
//  Type (default is none)
// generators can be added, deleted, updated, and displayed
// the display panel is a modal that is popped up either from the Track Add Generator button
// or by clcking on the generator icon on the time line
// the following is done by the timelinedisplay
// when a generator is modified, it is placed on the track's timeline as a 'icon' with name and tye indicators. 
// TODO error handling causing problems
import { useEffect } from "react";
import Track from "../../classes/track";
import { useState } from "react";
import { GENERATORTYPES } from "../../types/types";
import { MouseEvent } from "react";
import GeneratorTypeForm from "./generatortypeform";
import { FormEvent } from "react";
import { ChangeEvent } from "react";
import CMG from "../../classes/cmg";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import { SoundFont2 } from "soundfont2";
import { validateSFPGValues } from "./sfpgdialog";
import { Preset } from "../../types/soundfonttypes";

// The icon starts at the generator's start time and ends at the generators endtime
export interface GeneratorDialogProps {
    track: Track;
    setTracks: Function;
    generatorIndex: number,
    presets: Preset[],
    setEnableGenerator: Function,
    setMessage: Function,
    setStatus: Function,
    setOpen: Function
}



export default function GeneratorDialog(props: GeneratorDialogProps) {
    const { track, setTracks, presets, generatorIndex, setEnableGenerator, setMessage, setStatus, setOpen } = props;
    const [showModal, setShowModal] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [oldName, setOldName] = useState<string>('');
    const [generatorName, setGeneratorName] = useState<string>('');
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [formData, setFormData] = useState<CMG | SFPG | SFRG>(new CMG(track.generators.length + 1));
    useEffect(() => {
        // either get the generator from the track or build a new one if being added
        if (generatorIndex < 0) {
            const g = new CMG(track.generators.length + 1);
            setFormData(g);
            setOldName(g.name);

        } else {
            setFormData(track.generators[generatorIndex]);
            setOldName(track.generators[generatorIndex].name);
        }
        setShowModal(true);
    }, []);


    function handleChange(event: ChangeEvent<HTMLElement>): void {
        setFormData(() => ({
            ...formData,
            [event.target.name]: event.target.value
        }))
    }

    function handleSubmit(event: FormEvent<HTMLElement>): void {
        // validate the form values
        event.preventDefault();
        const msgs: string[] = [];
        switch (formData.type) {
            case "CMG": {
                const newMessages = validateCMGValues(formData);
                msgs.concat(newMessages);
                if (msgs.length > 0) {
                    setErrorMessages(msgs);
                    setMessage({ error: true, text: "Errors on generator form" });
                    return;
                }
            }
                break;
            case "SFPG": {
                let newMessages = validateCMGValues(formData);
                msgs.concat(newMessages);
                newMessages = validateSFPGValues(formData as SFPG);
                msgs.concat(newMessages);
                if (msgs.length > 0) {
                    setErrorMessages(msgs);
                    setMessage({ error: true, text: "Errors on generator form" });
                    return;
                }
            }
                break;
            // case "SFRG": {
            //     const newMessages = validateSFRGValues(formData as SFRG);
            //     msgs.concat(newMessages);
            //     if (msgs.length > 0) {
            //         setErrorMessages(msgs);
            //         setMessage({ error: true, text: "Errors on generator form" });
            //         return;
            //     }
            // }
            //     break;
            default: {
                setMessage({ error: true, text: `Invalid generator type ${formData.type}` })
            }

        }

        if (generatorIndex < 0) {
            // add a new generator to the current track
            setTracks((ts: Track[]) => {
                ts.map((t: Track) => {
                    if (t.name == track.name) {
                        track.generators.push(formData);
                    }
                    return t;
                })
                return ts;
            });
            setStatus(`Generator: ${formData.name} added to track ${track.name}`)
        }
        else {
            // this is a modify. change the generator on the active track
            setTracks((ts: Track[]) => {
                ts.map((t: Track) => {
                    if (t.name == track.name) {
                        const genIndex = t.generators.findIndex((g) => (g.name == oldName))
                        if (genIndex >= 0) {
                            t.generators[genIndex] = formData;
                        }
                    }
                    return t;
                })
                return ts;
            })
        }
        setShowModal(false);
        setOpen(false);
        setEnableGenerator(false);
        return;

        function validateCMGValues(values: CMG): string[] {
            const result: string[] = [];
            if (values.name == '') result.push('Name must not be blank');
            else {
                const index = track.generators.findIndex((g) => g.name == values.name);
                if (index >= 0) result.push('A generator with than name already exists');
            }
            if (values.startTime < 0 || values.stopTime <= values.stopTime)
                result.push('All times must be greater than zero and stop must be greater than start');
            return result;
        }
    }

    function handleCancelClick() {
        setShowModal(false);
        setOpen(false);
        setEnableGenerator(false);
    }

    function handleDeleteClick(event: MouseEvent<HTMLElement>) {
        console.log(event.currentTarget.id);
        const gName = event.currentTarget.id.split(":")[1];
        setGeneratorName(gName);
        setDeleteModal(true);
    }

    function handleDeleteOK(event: MouseEvent<HTMLElement>): void {
        const gName = event.currentTarget.id.split(':')[1];
        const index = track.generators.findIndex((g) => g.name == gName);
        if (index < 0) return;
        setTracks((ts: Track[]) => {
            ts.map((t) => {
                if (track.name == track.name) {
                    t.generators.splice(index, 1);
                    return t;
                }
            })
            return ts;
        })
        setDeleteModal(false);
    }

    function handleDeleteCancel() {
        setDeleteModal(true);
    }

    return (
        <>
            <div
                style={{ display: showModal ? "block" : "none" }}
                className="generator-content"
            >
                <div className='generator-header'>
                    <span className='close' onClick={handleCancelClick}>&times;</span>
                    <h2>{generatorIndex < 0 ? 'New Generator' : 'Generator: ' + formData.name}</h2>
                    {errorMessages.map((m) => (
                        <h3 color='red'>{m}</h3>
                    ))}
                </div>
                <div className="generator-body">
                    <form name='generator_CRUD' id='generator_CRUD'
                        onSubmit={handleSubmit}
                    >
                        <label htmlFor="name">Name:</label>
                        <input name='name'
                            type='text'
                            onChange={handleChange}
                            value={formData.name}
                        />
                        <label htmlFor="startTime">Start Time:</label>
                        <input name="startTime"
                            type='number'
                            onChange={handleChange}
                            value={formData.startTime}
                        />
                        <label htmlFor="stopTime">Stop Time:</label>
                        <input name="stopTime"
                            type='number'
                            onChange={handleChange}
                            value={formData.stopTime}
                        />
                        <label htmlFor="type">Type:</label>
                        <select name='type'
                            onChange={handleChange}
                            value={formData.type}
                        >
                            {Object.keys(GENERATORTYPES).map((t) => {
                                if (!parseInt(t) && t != '0')
                                    return (
                                        <option key={'GT-' + t} value={t}>{t}</option>
                                    )
                            })}
                        </select>
                        <hr />
                        <GeneratorTypeForm
                            formData={formData}
                            setFormData={setFormData} 
                            handleChange={handleChange}
                            presets={presets}
                            />
                            <hr/>
                        <input type='submit'
                            value={generatorIndex < 0 ? 'Add' : 'Modify'}
                        />
                    </form>
                </div>
                <div className='generator-footer'>
                    <button
                        hidden={generatorIndex < 0}
                        id={"generator-delete:" + formData.name}
                        onClick={handleDeleteClick}
                    >Delete
                    </button>
                    <button
                        id={"generator-update:" + formData.name}
                        onClick={handleCancelClick}
                    >
                        Cancel
                    </button>
                </div>
            </div>
            <div
                style={{ display: deleteModal ? "block" : "none" }}
                className="modal-content"
            >
                <div className='modal-header'>
                    <span className='close'>&times;</span>
                    <h2>Confirm deletion of generator '{generatorName}'</h2>
                </div>
                <div className="modal-body">
                    <p>
                        Select OK to delete generator or Cancel to abort deletion.
                    </p>
                </div>
                <div className='modal-footer'>
                    <button
                        id={"track-delete:" + generatorName}
                        onClick={handleDeleteOK}
                    >OK</button>
                    <button
                        onClick={handleDeleteCancel}
                    >Cancel</button>
                </div>
            </div>

        </>
    )
}

