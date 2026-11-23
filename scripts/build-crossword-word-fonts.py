"""Prepare editable Word font assets from the app's OFL-licensed WOFF files.
Requires fonttools and brotli. Run from the repository root; no runtime build step.
Font family aliases deliberately omit spaces to keep docx 9.6.1 package URIs valid.
The original font license and copyright records are retained.
"""
import base64
from io import BytesIO
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

repo = Path(__file__).resolve().parents[1]
for kind, weight, family in [('sans', 400, 'HitzBiraSans'), ('display', 700, 'HitzBiraDisplay')]:
    font = TTFont(repo / 'fonts' / f'hitzbira-{kind}-var.woff')
    axes = {axis.axisTag: axis.defaultValue for axis in font['fvar'].axes}
    axes['wght'] = weight
    font = instantiateVariableFont(font, axes, inplace=True)
    font.flavor = None
    names = {1: family, 2: 'Regular', 3: family + ' Word', 4: family,
             6: family, 16: family, 17: 'Regular'}
    for name in font['name'].names:
        if name.nameID in names:
            name.string = names[name.nameID].encode(name.getEncoding())
    stream = BytesIO()
    font.save(stream)
    (repo / 'fonts' / f'hitzbira-word-{kind}.ttf.b64').write_text(
        base64.b64encode(stream.getvalue()).decode(), encoding='ascii')
