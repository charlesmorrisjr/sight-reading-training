import { WebMidi } from 'webmidi';

class MidiManager {
  constructor() {
    this.isEnabled = false;
    this.connectedInputs = [];
    this.activeInput = null;
    this.eventListeners = {};
    
    console.log('🎹 MidiManager: Constructor initialized');
  }

  // Initialize WebMIDI
  async enable() {
    console.log('🎹 MidiManager: Starting WebMIDI initialization...');
    
    try {
      // Check if Web MIDI API is supported
      if (!navigator.requestMIDIAccess) {
        console.error('🎹 MidiManager: Web MIDI API not supported in this browser');
        throw new Error('Web MIDI API not supported');
      }
      
      console.log('🎹 MidiManager: Web MIDI API is supported, requesting access...');
      
      // Enable WebMIDI
      await WebMidi.enable();
      
      this.isEnabled = true;
      console.log('🎹 MidiManager: WebMIDI enabled successfully!');
      
      // Log initial device state
      this.logDeviceInfo();
      
      // Set up device connection listeners
      this.setupDeviceListeners();
      
      return true;
      
    } catch (error) {
      console.error('🎹 MidiManager: Failed to enable WebMIDI:', error);
      this.isEnabled = false;
      throw error;
    }
  }

  // Log detailed information about available MIDI devices
  logDeviceInfo() {
    console.log('🎹 MidiManager: === DEVICE INFO ===');
    console.log('🎹 MidiManager: WebMIDI enabled:', this.isEnabled);
    console.log('🎹 MidiManager: WebMIDI supported:', WebMidi.supported);
    
    // Log input devices
    const inputs = WebMidi.inputs;
    console.log('🎹 MidiManager: Available input devices:', inputs.length);
    
    if (inputs.length === 0) {
      console.log('🎹 MidiManager: No MIDI input devices found');
      console.log('🎹 MidiManager: Make sure your MIDI keyboard is connected and powered on');
    } else {
      inputs.forEach((input, index) => {
        console.log(`🎹 MidiManager: Input ${index + 1}:`, {
          id: input.id,
          name: input.name,
          manufacturer: input.manufacturer,
          state: input.state,
          connection: input.connection,
          type: input.type
        });
      });
    }
    
    // Log output devices for completeness
    const outputs = WebMidi.outputs;
    console.log('🎹 MidiManager: Available output devices:', outputs.length);
    
    outputs.forEach((output, index) => {
      console.log(`🎹 MidiManager: Output ${index + 1}:`, {
        id: output.id,
        name: output.name,
        manufacturer: output.manufacturer
      });
    });
    
    console.log('🎹 MidiManager: === END DEVICE INFO ===');
  }

  // Set up listeners for device connections/disconnections
  setupDeviceListeners() {
    console.log('🎹 MidiManager: Setting up device connection listeners...');
    
    WebMidi.addListener('connected', (event) => {
      console.log('🎹 MidiManager: Device connected:', {
        id: event.port.id,
        name: event.port.name,
        type: event.port.type,
        manufacturer: event.port.manufacturer
      });
      
      // Refresh device info when new device connects
      setTimeout(() => this.logDeviceInfo(), 100);
    });
    
    WebMidi.addListener('disconnected', (event) => {
      console.log('🎹 MidiManager: Device disconnected:', {
        id: event.port.id,
        name: event.port.name,
        type: event.port.type
      });
      
      // If the disconnected device was our active input, clear it
      if (this.activeInput && this.activeInput.id === event.port.id) {
        console.log('🎹 MidiManager: Active input device disconnected, clearing...');
        this.activeInput = null;
      }
      
      // Refresh device info
      setTimeout(() => this.logDeviceInfo(), 100);
    });
  }

  // Get list of available input devices
  getAvailableInputs() {
    if (!this.isEnabled) {
      console.warn('🎹 MidiManager: Cannot get inputs - WebMIDI not enabled');
      return [];
    }
    
    const inputs = WebMidi.inputs;
    console.log('🎹 MidiManager: Getting available inputs:', inputs.length);
    
    return inputs.map(input => ({
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer,
      state: input.state,
      connection: input.connection
    }));
  }

  // Connect to a specific MIDI input device
  connectToInput(inputId) {
    console.log('🎹 MidiManager: Attempting to connect to input:', inputId);
    
    if (!this.isEnabled) {
      console.error('🎹 MidiManager: Cannot connect - WebMIDI not enabled');
      throw new Error('WebMIDI not enabled');
    }

    const input = WebMidi.getInputById(inputId);
    
    if (!input) {
      console.error('🎹 MidiManager: Input device not found:', inputId);
      throw new Error(`MIDI input device not found: ${inputId}`);
    }

    // Disconnect from previous input if any
    if (this.activeInput) {
      console.log('🎹 MidiManager: Disconnecting from previous input:', this.activeInput.name);
      this.disconnectFromInput();
    }

    this.activeInput = input;
    console.log('🎹 MidiManager: Successfully connected to input:', {
      id: input.id,
      name: input.name,
      manufacturer: input.manufacturer
    });

    return true;
  }

  // Disconnect from current input device
  disconnectFromInput() {
    if (!this.activeInput) {
      console.log('🎹 MidiManager: No active input to disconnect from');
      return;
    }

    console.log('🎹 MidiManager: Disconnecting from input:', this.activeInput.name);
    
    // Remove all event listeners from the input
    this.activeInput.removeListener();
    
    this.activeInput = null;
    console.log('🎹 MidiManager: Successfully disconnected from input');
  }

  // Check if MIDI is supported and enabled
  getStatus() {
    const status = {
      supported: WebMidi.supported,
      enabled: this.isEnabled,
      activeInput: this.activeInput ? {
        id: this.activeInput.id,
        name: this.activeInput.name,
        manufacturer: this.activeInput.manufacturer
      } : null,
      availableInputsCount: this.isEnabled ? WebMidi.inputs.length : 0
    };
    
    console.log('🎹 MidiManager: Current status:', status);
    return status;
  }

  // Disable WebMIDI and cleanup
  disable() {
    console.log('🎹 MidiManager: Disabling WebMIDI...');
    
    if (this.activeInput) {
      this.disconnectFromInput();
    }
    
    if (this.isEnabled) {
      WebMidi.disable();
      this.isEnabled = false;
      console.log('🎹 MidiManager: WebMIDI disabled');
    }
  }
}

// Create and export a singleton instance
const midiManager = new MidiManager();
export default midiManager;