# Note Sequencer Generator
uses a sequence of notes as the basis for source generation over time. A note sequence is a list of notes and durations. 
The best way to represent this is using Music XML [see Music XML 4.0](https://www.w3.org/2021/06/musicxml40/); however, this generator will only produce a single voice.

Premanent storage is needed to store various note sequences and that be strung together as separate generators. This database would store each sequence (in Music XML format for a single voice?) with a unqiue name and tags used to aid in seraching. 

Each generator has attrtibutes assignable to each note in the sequence. Attibute values depend on the generator type (Constant, Osciallator, etc.) with the addition of a new type that uses the number of the note in the sequence. The attribute value is taken from an array arranged by seqeunce number.

It would be nice to implement slurs, cresendo(during note), and glissandi (sample rate changes during note).