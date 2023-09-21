import xml.etree.ElementTree as ET

def generate_html_animation_from_musicxml(musicxml_data, output_filename):
    try:
        tree = ET.parse('lana.xml')
        root = tree.getroot()

        # Extract note data from the MusicXML file.
        notes = []
        for note in root.findall('.//note'):
            
            pitch = note.find('./pitch')
           
            
            if pitch is not None:
                
                step = pitch.find('./step').text
                octave = pitch.find('./octave').text
                duration = note.find('./duration').text
                # print(step, octave, duration)
                notes.append({'step': step, 'octave': octave, 'duration': duration})
            else: 
                print("OK")
                print(note)
                print(note.findall("*"))
                notes.append({'step': 0, 'duration': duration})
        placeholder = len(notes)*30
        # Create an HTML document with SVG for animation.
        svg_animation = f"""
        <svg width="{800}" height="{placeholder}" xmlns="http://www.w3.org/2000/svg">
        """

        x_position = 0
        y_position = 100
        current_row = 0
        current_height = 0
        for note in notes:
            # Calculate note position based on pitch.
            note_x = x_position
            # note_y = y_position - (int(note['octave']) * 10)
            
            
            note_duration = int(note['duration']) * 3
            
            if (current_row + note_duration + 2) >= 800:
                current_row = 0
                current_height += 15

            def get_color(note):
                if 'octave' in note:
                    option = int(note['octave'])
                else:
                    return "grey"

                if option == 1:
                    return "black"
                elif option == 2:
                    return "green"
                elif option == 3:
                    return "blue"
                elif option == 4:
                    return "red"
                elif option == 5:
                    return "purple"
                else:
                    return "Invalid option"
            # Add a rectangle representing the note with animation.
            svg_animation += f"""
            <rect x="{current_row}" y="{current_height}" width="{note_duration}" height="12" fill="{get_color(note)}">
            </rect>
            """
            #                 <animate attributeName="x" from="{note_x}" to="{note_x + 10}" dur="{note['duration']}s" />


            
            current_row += note_duration + 2
        svg_animation += "</svg>"

        # Create the HTML document.
        html = f"""
        <html>
        <head></head>
        <body>
            <h1>MusicXML Animation</h1>
            {svg_animation}
        </body>
        </html>
        """

        # Write the HTML to a file.
        with open(output_filename, 'w') as html_file:
            html_file.write(html)

    except ET.ParseError as e:
        print(f"Error parsing MusicXML: {e}")

# Example MusicXML data
musicxml_data = """
<score-partwise version="3.1">
  <!-- MusicXML data here -->
</score-partwise>
"""

# Generate and save the HTML animation
generate_html_animation_from_musicxml(musicxml_data, 'musicxml_animation.html')