# Initial
i want to create a sight reading training app for piano.

i want to use the abcjs library to display the music.

The front end should be a web app that can be used on any device especially tablets like iPads.

The design should be simple, modern, and clean.

The app should be able to generate random music in any key and any time signature.

Users should be able to select the key and time signature they want to practice.

Users should be able to select the number of measures they want to practice.

Users should be able to select the intervals they want to practice from a 2nd to an 8th.

Users should be able to select from a range of note durations from 1/16 to whole notes.

The attached file is a simple MVP of the product, but the finished product should look professional. You can take the music generation code and include it in the final product, or create a placeholder for it instead.

# Next step
Change the default background color of the sheet music display to white with black notes. However, a dark mode will added later, so the current color theme can be kept available for later when the dark mode is added.

Move menu to hamburger menu or separate page so sheet music can be full-screen.

The sheet music display should be the main focus of the app. It should be the only thing that is visible when the app is opened aside from the hamburger menu and the title of the app. Also, move the generate music button below the sheet music display.

Change checkboxes to buttons so this project will be easier to use on mobile.

The entire project should have mobile first approach.

The menu should be hidden until the user clicks the hamburger menu.

The menu should be a dropdown menu that appears from the top of the screen.

# Next step
I want the hamburger menu to slide in from the right side of the screen instead of the top. 

Change the menu so it has submenus for each option.

The main menu should have the following options:
- Key
- Time Signature
- Measures
- Intervals
- Note Durations

Instead of dropdown menus, use buttons for each option within each submenu.

Tell me what buttons you're going to place within each submenu.

# Adjustment
For the key submenu, add buttons for the major and minor keys. If the user selects the major key button, the submenu should show the major key buttons. If the user selects the minor key button, the submenu should show the minor keys buttons.

# Adjustment
Make the submenu buttons (e.g, the keys, time signatures, etc.) in a single column list instead of multiple columns. The idea is to make the submenu buttons easier to read and click, especially on mobile devices.

# Adjustment
Remove the "Generate Music" button from the main menu.

Also, make the menu and submenu slightly taller. Increase the font size of the menu and submenu buttons. The idea is to make the menu and submenu easier to read and click, especially on mobile devices.


# Enhance music generation algorithm
I want to enhance the music generation algorithm to generate more realistic music.
Specifically, I want the left hand should follow chord progressions and bass patterns. The right hand should play the melody that harmonizes with the chord progressions and bass patterns.

To start, modify the music generation algorithm so the left hand contains whole note block chords. The chords should be generated based on a random chord progression. Later, the chord progressions will be selectable by the user in the settings menu, but for now, the algorithm should generate a random chord progression.

# Next step
Add a menu to the settings page that allows the user to select the chord progressions they want to practice. Use the chord progressions in the musicGenerator.js file in the CHORD_PROGRESSIONS array.

Also add a menu to the settings page that allows the user to select the bass patterns they want to practice. The only bass pattern that will be available for now is block chords. More bass patterns will be added later.
