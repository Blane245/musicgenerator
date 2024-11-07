//courtesy https://blog.gskinner.com/archives/2019/02/reverb-web-audio-api.html
// SAFARI Polyfills
if (!window.AudioBuffer.prototype.copyToChannel) {
	window.AudioBuffer.prototype.copyToChannel = function copyToChannel(buffer, channel) {
		this.getChannelData(channel).set(buffer);
	}
}
if (!window.AudioBuffer.prototype.copyFromChannel) {
	window.AudioBuffer.prototype.copyFromChannel = function copyFromChannel(buffer, channel) {
		buffer.set(this.getChannelData(channel));
	}
}


export class Effect {
	name: string;
	context: AudioContext | OfflineAudioContext;
	input: GainNode;
	bypassed: boolean;
	output: GainNode;
	effect: AudioNode | null;
	constructor(context: AudioContext | OfflineAudioContext) {
		this.name = "effect";
		this.context = context;
		this.input = this.context.createGain();
		this.effect = null;
		this.bypassed = false;
		this.output = this.context.createGain();
		this.setup();
		this.wireUp();
	}

	setup() {
		this.effect = this.context.createGain();
	}

	wireUp() {
		if (this.effect) {
			this.input.connect(this.effect);
			this.effect.connect(this.output);
		}
	}

	connect(destination: AudioNode) {
		this.output.connect(destination);
	}

}

export class Sample {
	context: AudioContext | OfflineAudioContext;
	buffer: AudioBufferSourceNode;
	sampleBuffer: AudioBuffer | null;
	//rawbuffer?
	loaded: boolean;
	output: GainNode;

	constructor(context: AudioContext | OfflineAudioContext) {
		this.context = context;
		this.buffer = this.context.createBufferSource();
		this.buffer.start();
		this.sampleBuffer = null
		// this.rawBuffer = null;
		this.loaded = false;
		this.output = this.context.createGain();
		this.output.gain.value = 0.1;
	}

	play() {
		if (this.loaded) {
			this.buffer = this.context.createBufferSource();
			this.buffer.buffer = this.sampleBuffer;
			this.buffer.connect(this.output);
			this.buffer.start(this.context.currentTime);
		}
	}

	connect(input: AudioNode) {
		this.output.connect(input);
	}

	// TODO this is load smaples from a file. other options will be needed
	async load(path: string | URL | globalThis.Request) {
		this.loaded = false;
		const response = await fetch(path);
		const myBlob = await response.arrayBuffer();
		const buffer: AudioBuffer = await new Promise((resolve, reject) => {
			this.context.decodeAudioData(myBlob, resolve, reject);
		});
		this.sampleBuffer = buffer;
		this.loaded = true;
		return this;
	}
}


export class AmpEnvelope {
	context: AudioContext | OfflineAudioContext;
	output: GainNode;
	partials:AudioNode[];
	velocity: number;
	gain: number;
	_attack: number;
	_decay: number;
	_sustain: number;
	_release: number;

	constructor(context: AudioContext | OfflineAudioContext, gain: number = 1) {
		this.context = context;
		this.output = this.context.createGain();
		this.output.gain.value = gain;
		this.partials = [];
		this.velocity = 0;
		this.gain = gain;
		this._attack = 0;
		this._decay = 0.001;
		this._sustain = this.output.gain.value;
		this._release = 0.001;
	}

	on(velocity:number) {
		this.velocity = velocity / 127;
		this.start(this.context.currentTime);
	}

	off() {
		return this.stop(this.context.currentTime);
	}

	start(time:number) {
		this.output.gain.value = 0;
		this.output.gain.setValueAtTime(0, time);
		this.output.gain.setTargetAtTime(1, time, this.attack + 0.00001);
		this.output.gain.setTargetAtTime(this.sustain * this.velocity, time + this.attack, this.decay);
	}

	stop(time:number) {
		this.sustain = this.output.gain.value;
		this.output.gain.cancelScheduledValues(time);
		this.output.gain.setValueAtTime(this.sustain, time);
		this.output.gain.setTargetAtTime(0, time, this.release + 0.00001);
	}

	set attack(value:number) {
		this._attack = value;
	}

	get attack() {
		return this._attack
	}

	set decay(value:number) {
		this._decay = value;
	}

	get decay() {
		return this._decay;
	}

	set sustain(value:number) {
		this.gain = value;
		this._sustain;
	}

	get sustain() {
		return this.gain;
	}

	set release(value: number) {
		this._release = value;
	}

	get release() {
		return this._release;
	}

	connect(destination: AudioNode) {
		this.output.connect(destination);
	}
}

export class Voice {
	context: AudioContext | OfflineAudioContext;
	type: string;
	gain: number;
	output: GainNode;
	ampEnvelope: AmpEnvelope;
	value:number;
	partials:AudioNode[];

	constructor(context:AudioContext | OfflineAudioContext, type:string = "sawtooth", gain:number = 0.1) {
		this.context = context;
		this.type = type;
		this.value = -1;
		this.gain = gain;
		this.output = this.context.createGain();
		this.partials = [];
		this.output.gain.value = this.gain;
		this.ampEnvelope = new AmpEnvelope(this.context);
		this.ampEnvelope.connect(this.output);
	}

	init() {
		let osc:OscillatorNode = this.context.createOscillator();
		osc.type = (this.type as OscillatorType);
		osc.connect(this.ampEnvelope.output);
		osc.start(this.context.currentTime);
		this.partials.push(osc);
	}

	on(MidiEvent) {
		this.value = MidiEvent.value;
		this.partials.forEach((osc:AudioNode) => {
			(osc as OscillatorNode).frequency.value = MidiEvent.frequency;
		});
		this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
	}

	off() {
		this.ampEnvelope.off();
		this.partials.forEach((osc:AudioNode) => {
			(osc as OscillatorNode).stop(this.context.currentTime + this.ampEnvelope.release * 4);
		});
	}

	connect(destination: AudioNode) {
		this.output.connect(destination);
	}

	set detune(value:number) {
		this.partials.forEach((p:AudioNode) => (p as OscillatorNode).detune.value = value);
	}

	set attack(value:number) {
		this.ampEnvelope.attack = value;
	}

	get attack() {
		return this.ampEnvelope.attack;
	}

	set decay(value:number) {
		this.ampEnvelope.decay = value;
	}

	get decay() {
		return this.ampEnvelope.decay;
	}

	set sustain(value:number) {
		this.ampEnvelope.sustain = value;
	}

	get sustain() {
		return this.ampEnvelope.sustain;
	}

	set release(value:number) {
		this.ampEnvelope.release = value;
	}

	get release() {
		return this.ampEnvelope.release;
	}

}
export class Noise extends Voice {
	_length: number;
	constructor(context: AudioContext | OfflineAudioContext, gain: number) {
		super(context, 'sawtooth', gain);
		this._length = 2;
	}

	get length() {
		return this._length || 2;
	}
	set length(value) {
		this._length = value;
	}

	override init() {
		const lBuffer = new Float32Array(this.length * this.context.sampleRate);
		const rBuffer = new Float32Array(this.length * this.context.sampleRate);
		for (let i = 0; i < this.length * this.context.sampleRate; i++) {
			lBuffer[i] = 1 - (2 * Math.random());
			rBuffer[i] = 1 - (2 * Math.random());
		}
		let buffer = this.context.createBuffer(2, this.length * this.context.sampleRate, this.context.sampleRate);
		buffer.copyToChannel(lBuffer, 0);
		buffer.copyToChannel(rBuffer, 1);

		let osc = this.context.createBufferSource();
		osc.buffer = buffer;
		osc.loop = true;
		osc.loopStart = 0;
		osc.loopEnd = 2;
		osc.start(this.context.currentTime);
		osc.connect(this.ampEnvelope.output);
		this.partials.push(osc);
	}

	override on(MidiEvent) {
		this.value = MidiEvent.value;
		this.ampEnvelope.on(MidiEvent.velocity || MidiEvent);
	}

}

export class Filter extends Effect {
	constructor(context: AudioContext | OfflineAudioContext, type = 'lowpass', cutoff = 1000, resonance = 0.9) {
		super(context);
		this.name = "filter";
		this.effect = context.createBiquadFilter();
		(this.effect as BiquadFilterNode).frequency.value = cutoff;
		(this.effect as BiquadFilterNode).Q.value = resonance;
		(this.effect as BiquadFilterNode).type = (type as BiquadFilterType);
	}

	override setup() {
		this.effect = this.context.createBiquadFilter();
		this.effect.connect(this.output);
		this.wireUp();
	}

}