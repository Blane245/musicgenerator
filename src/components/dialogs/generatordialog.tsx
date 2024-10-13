// provides CRUD for all types of generators
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import CMG from "../../classes/cmg";
import SFPG from "../../classes/sfpg";
import SFRG from '../../classes/sfrg';
import Track from "../../classes/track";
import { useCMGContext } from "../../contexts/cmgcontext";
import { CMGeneratorType, GENERATORTYPES } from "../../types/types";
import { addGenerator, deleteGenerator, modifyGenerator } from "../../utils/cmfiletransactions";
import GeneratorTypeForm from "./generatortypeform";
import { validateSFPGValues } from "./sfpgdialog";
import { validateSFRGValues } from "./sfrgdialog";
import Noise from "../../classes/noise";
import { validateNoiseValues } from "./noisedialog";
import { Preset } from "types/soundfonttypes";
import { bankPresettoName } from "utils/util";

// The icon starts at the generator's start time and ends at the generators endtime
export interface GeneratorDialogProps {
    track: Track;
    generatorIndex: number,
    setGeneratorIndex: Function,
    closeTrackGenerator: Function,
    setOpen: Function
}

export default function GeneratorDialog(props: GeneratorDialogProps) {
    const { track, generatorIndex, setGeneratorIndex, closeTrackGenerator, setOpen } = props;
    const { setFileContents, setMessage, presets, setStatus } = useCMGContext();
    const [showModal, setShowModal] = useState<boolean>(false);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [oldName, setOldName] = useState<string>('');
    const [generatorName, setGeneratorName] = useState<string>('');
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const [formData, setFormData] = useState<CMG | SFPG>(new CMG(0));
    useEffect(() => {
        // either get the generator from the track or build a new one if being added
        if (generatorIndex < 0) {

            // create a generator with a unique name
            let next = track.generators.length + 1;
            let found = false;
            while (!found) {
                const newName = 'G'.concat(next.toString());
                if (track.generators.findIndex((g) => (g.name == newName)) < 0) {
                    found = true;
                } else {
                    next++
                }
            }
            const g = new CMG(next);
            setFormData(g);
            setOldName(g.name);

        } else {
            setFormData(track.generators[generatorIndex]);
            setOldName(track.generators[generatorIndex].name);
        }
        setShowModal(true);
    }, []);


    function handleChange(event: ChangeEvent<HTMLElement>): void {
        setFormData((prev: CMGeneratorType) => {
            const eventName: string | null = event.target['name'];
            const eventValue: string | null = event.target['value'];
            // get a copy of the base elements
            switch (formData.type) {
                case 'CMG': {
                    const newFormData: CMG = (prev as CMG).copy();
                    if (eventName && eventValue) {
                        newFormData.setAttribute(eventName, eventValue);
                        return newFormData;
                    }
                    return prev;
                }
                case 'SFPG': {
                    const newFormData: SFPG = (prev as SFPG).copy();
                    if (eventName && eventValue) {
                        newFormData.setAttribute(eventName, eventValue);
                        return newFormData;
                    }
                    return prev;
                }
                case 'SFRG': {
                    const newFormData: SFRG = (prev as SFRG).copy();
                    if (eventName && eventValue) {
                        newFormData.setAttribute(eventName, eventValue);
                        return newFormData;
                    }
                    return prev;
                }
                case 'Noise': {
                    const newFormData: Noise = (prev as Noise).copy();
                    if (eventName && eventValue) {
                        newFormData.setAttribute(eventName, eventValue);
                        return newFormData;
                    }
                    return prev;
                }
                default:
                    return prev as CMG;
            }
        })
    }

    // copies the basic data and change the type of the form data
    function handleTypeChange(event: ChangeEvent<HTMLElement>): void {
        const newType: string = event.target['value'];
        setFormData((prev: CMG | SFPG | SFRG) => {
            switch (newType) {
                case 'CMG': {
                    const newF = new CMG(0);
                    newF.name = prev.name;
                    newF.startTime = prev.startTime;
                    newF.stopTime = prev.stopTime;
                    return newF;
                }
                case 'SFPG': {
                    const newF = new SFPG(0);
                    newF.name = prev.name;
                    newF.startTime = prev.startTime;
                    newF.stopTime = prev.stopTime;
                    return newF;
                }
                case 'SFRG': {
                    const newF = new SFRG(0);
                    newF.name = prev.name;
                    newF.startTime = prev.startTime;
                    newF.stopTime = prev.stopTime;
                    return newF;
                }
                case 'Noise': {
                    const newF = new Noise(0);
                    newF.name = prev.name;
                    newF.startTime = prev.startTime;
                    newF.stopTime = prev.stopTime;
                    return newF;
                }
                default:
                    return prev;
            }

        })

    }

    function handleSubmit(event: FormEvent<HTMLElement>): void {
        event.preventDefault();
        const msgs: string[] = [];
        switch (formData.type) {
            case "CMG": {
                const newMessages = validateCMGValues(formData);
                msgs.push(...newMessages);
                if (msgs.length > 0) {
                    setErrorMessages(msgs);
                    setMessage({ error: true, text: "Errors on generator form" });
                    return;
                }
            }
                break;
            case "SFPG": {
                let newMessages = validateCMGValues(formData);
                msgs.push(...newMessages);
                newMessages = validateSFPGValues(formData as SFPG, presets);
                msgs.push(...newMessages);
                if (msgs.length > 0) {
                    setErrorMessages(msgs);
                    setMessage({ error: true, text: "Errors on generator form" });
                    return;
                }
                const pn:string = (formData as SFPG).presetName.split(":")[2];
                (formData as SFPG).preset = presets.find((p:Preset) => (pn == p.header.name));

            }
                break;
            case "SFRG": {
                let newMessages = validateCMGValues(formData);
                msgs.push(...newMessages);
                newMessages = validateSFRGValues(formData as SFRG, presets);
                msgs.push(...newMessages);
                if (msgs.length > 0) {
                    setErrorMessages(msgs);
                    setMessage({ error: true, text: "Errors on generator form" });
                    return;
                }
                const pn:string = (formData as SFRG).presetName.split(":")[2];
                (formData as SFPG).preset = presets.find((p:Preset) => (pn == p.header.name));
            }
                break;
            case "Noise": {
                let newMessages = validateCMGValues(formData);
                msgs.push(...newMessages);
                newMessages = validateNoiseValues(formData as Noise);
                msgs.push(...newMessages);
                if (msgs.length > 0) {
                    setErrorMessages(msgs);
                    setMessage({ error: true, text: "Errors on generator form" });
                    return;
                }
            }
                break;
            default: {
                setMessage({ error: true, text: `Invalid generator type ${formData.type}` })
            }
        }

        if (generatorIndex < 0) {
            // add a new generator to the current track 
            addGenerator(track, formData, setFileContents);
        }
        else {
            // this is a modify. change the generator on the active track
            modifyGenerator(track, formData, oldName, setFileContents);
        }
        setShowModal(false);
        setOpen(false);
        closeTrackGenerator();
        return;

        function validateCMGValues(values: CMG): string[] {
            const result: string[] = [];
            if (values.name == '') result.push('Name must not be blank');
            else {
                if (values.name != oldName) {
                    const index = track.generators.findIndex((g) => g.name == values.name);
                    if (index >= 0) result.push('A generator with that name already exists');
                }
            }
            if (values.startTime < 0 || values.stopTime <= values.startTime)
                result.push('All times must be greater than zero and stop must be greater than start');
            return result;
        }
    }

    function handleCancelClick(event: MouseEvent<HTMLElement>) {
        event.preventDefault();
        setShowModal(false);
        setOpen(false);
        closeTrackGenerator();
    }

    function handleDeleteClick(event: MouseEvent<HTMLElement>) {
        event.preventDefault();
        console.log(event.currentTarget.id);
        const gName = event.currentTarget.id.split(":")[1];
        setGeneratorName(gName);
        setDeleteModal(true);
    }

    function handleDeleteOK(event: MouseEvent<HTMLElement>): void {
        event.preventDefault();
        const gName = event.currentTarget.id.split(':')[1];
        const index = track.generators.findIndex((g) => g.name == gName);
        if (index < 0) return;

        deleteGenerator(track, gName, setFileContents);
        setDeleteModal(false);
        setGeneratorIndex(-1);
        closeTrackGenerator();
    }

    function handleDeleteCancel() {
        setDeleteModal(false);
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
                        <br />
                        <label htmlFor="startTime">Start Time:</label>
                        <input name="startTime"
                            type='number'
                            onChange={handleChange}
                            value={formData.startTime}
                        />
                        <span> (seconds)</span>
                        <br />
                        <label htmlFor="stopTime">Stop Time:</label>
                        <input name="stopTime"
                            type='number'
                            onChange={handleChange}
                            value={formData.stopTime}
                        />
                        <span> (seconds)</span>
                        <br />
                        <label htmlFor="type">Type:</label>
                        <select name='type'
                            onChange={handleTypeChange}
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
                            handleChange={handleChange}
                        />
                        <hr />
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
                    {errorMessages.map((m) => (
                        <h3 color='red'>{m}</h3>
                    ))}
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

