import { WebMidi } from 'webmidi';

// Initialize WebMIDI and set up note listening
export function initializeMIDI(onNoteEvent = null) {
  WebMidi
    .enable()
    .then(() => onEnabled(onNoteEvent))
    .catch(err => alert(err));
}

function onEnabled(onNoteEvent) {
  console.log("WebMidi enabled!");
  
  // List all available input devices
  WebMidi.inputs.forEach(input => {
    console.log(`MIDI Input: ${input.manufacturer} ${input.name}`);
  });

  // Find input device with "MIDI OUT" in the name
  const targetInput = WebMidi.inputs.find(input => 
    input.name.includes("USB MIDI")
  );

  if (targetInput) {
    console.log(`Listening to: ${targetInput.name}`);
    
    // Listen for note on events
    targetInput.addListener("noteon", e => {
      // Debugging note on events
      // console.log(`Note ON: ${e.note.identifier}`);
      if (onNoteEvent) {
        onNoteEvent({
          type: 'noteon',
          note: e.note.identifier,
          velocity: e.velocity,
          channel: e.message.channel
        });
      }
    });
    
    // Listen for note off events
    targetInput.addListener("noteoff", e => {
      // Debugging note off events
      // console.log(`Note OFF: ${e.note.identifier}`);
      if (onNoteEvent) {
        onNoteEvent({
          type: 'noteoff',
          note: e.note.identifier,
          velocity: e.velocity,
          channel: e.message.channel
        });
      }
    });
  } else {
    console.log("No MIDI input device with 'MIDI OUT' in name found");
    if (WebMidi.inputs.length > 0) {
      console.log("Available devices:", WebMidi.inputs.map(input => input.name));
    }
  }
}