import xml.etree.ElementTree as ET

def generate_musicxml_html(output_filename):
    try:
        tree = ET.parse('lana.xml')
        root = tree.getroot()

        # Initialize variables to track time signature and key signature
        current_time_signature = None
        current_key_signature = None

        # Create HTML for the musical staff, lines, time signature, key signature, and notes.
        html = f"""
        <html>
        <head>
            <style>
                .staff {{
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 20px;
                    margin-bottom: 20px;
                }}
                .measure {{
                    display: flex;
                    align-items: flex-end;
                }}
                .staff-line {{
                    border-bottom: 1px solid black;
                    width: 100%;
                    margin-bottom: 5px;
                }}
                .time-signature {{
                    font-size: 16px;
                    margin-bottom: 5px;
                }}
                .key-signature {{
                    font-size: 16px;
                    margin-bottom: 10px;
                }}
                .note {{
                    font-size: 20px;
                    margin-right: 2px;
                }}
                .rest {{
                    font-size: 20px;
                    margin-right: 2px;
                }}
            </style>
        </head>
        <body>
        """

        # Iterate through measures, generating SVG for each.
        for measure in root.findall('.//measure'):
            # Extract time signature if present in the measure.
            time_signature = measure.find('./attributes/time')
            if time_signature is not None:
                beats = time_signature.find('beats').text
                beat_type = time_signature.find('beat-type').text
                html += f'<div class="time-signature">Time Signature: {beats}/{beat_type}</div>'
                current_time_signature = (beats, beat_type)

            # Extract key signature if present in the measure.
            key_signature = measure.find('./attributes/key')
            if key_signature is not None:
                fifths = int(key_signature.find('fifths').text)
                mode = key_signature.find('mode').text
                html += f'<div class="key-signature">Key Signature: {fifths} {mode}</div>'
                current_key_signature = (fifths, mode)

            # Add staff lines between measures
            for _ in range(5):
                html += '<div class="staff-line"></div>'

            html += '<div class="measure">'
            for note in measure.findall('.//note'):
                if note.find('./rest') is not None:
                    # Handle rests
                    html += '<div class="rest">&#119070;</div>'  # Whole note rest
                else:
                    # Handle notes
                    step = note.find('./pitch/step').text
                    octave = int(note.find('./pitch/octave').text)
                    line_position = 8 - ((octave - 4) * 2 + ('CDEFGAB'.index(step) - 2) // 2)
                    html += f'<div class="note" style="top: {line_position * 20}px;">{step}</div>'

            html += '</div>'

        html += """
        </body>
        </html>
        """

         # Write the HTML to a file.
        with open(output_filename, 'w') as html_file:
            html_file.write(html)

    except ET.ParseError as e:
        return f"Error parsing MusicXML: {e}"

generate_musicxml_html('musicxml_notation.html')