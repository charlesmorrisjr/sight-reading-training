import { WebMidi } from 'webmidi';

// Initialize WebMIDI and set up note listening
export function initializeMIDI() {
  WebMidi
    .enable()
    .then(onEnabled)
    .catch(err => alert(err));
}

function onEnabled() {
  console.log("WebMidi enabled!");
  
  // List all available input devices
  WebMidi.inputs.forEach(input => {
    console.log(`MIDI Input: ${input.manufacturer} ${input.name}`);
  });

  // Find input device with "MIDI OUT" in the name
  const targetInput = WebMidi.inputs.find(input => 
    input.name.includes("MIDI OUT")
  );
  
  if (targetInput) {
    console.log(`Listening to: ${targetInput.name}`);
    
    // Listen for note on events
    targetInput.addListener("noteon", e => {
      console.log(e.note.identifier);
    });
  } else {
    console.log("No MIDI input device with 'MIDI OUT' in name found");
    if (WebMidi.inputs.length > 0) {
      console.log("Available devices:", WebMidi.inputs.map(input => input.name));
    }
  }
}