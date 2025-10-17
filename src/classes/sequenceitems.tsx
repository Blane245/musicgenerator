export class SequenceItem {

}
export class NoteItem extends SequenceItem{
    note: string;
    beats: number
  constructor (note:string, beats: number) {
    super()
    this.note = note;
    this.beats = beats;
  }
}
export class AttackItem extends SequenceItem{
    attack: string;
    time: number
  constructor (attack:string, time: number) {
    super()
    this.attack = attack;
    this.time = time;
  }
}
export class SpeedItem extends SequenceItem{
    speed: string;
    time: number
  constructor (attack:string, time: number) {
    super()
    this.speed = attack;
    this.time = time;
  }
}
export class DurationItem extends SequenceItem{
    duration: string;
    time: number
  constructor (duration:string, time: number) {
    super()
    this.duration = duration;
    this.time = time;
  }
}
export class VolumeItem extends SequenceItem{
    volume: string;
    time: number
  constructor (volume:string, time: number) {
    super()
    this.volume = volume;
    this.time = time;
  }
}
export class PanItem extends SequenceItem{
    pan: string;
    time: number
  constructor (pan:string, time: number) {
    super()
    this.pan = pan;
    this.time = time;
  }
}
