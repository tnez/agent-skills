---
name: image-review-pdf
description: Composable image and video thumbnail processing with PDF generation. Create review PDFs with annotation space, or use the lib modules in custom workflows like daily reports.
license: MIT
metadata:
  author: tnez
  version: "2.0.0"
---

# Image Review PDF

Composable library for processing images/videos and generating PDFs with thumbnails and annotation space. Use standalone via CLI or integrate into larger workflows.

## Two Ways to Use

### 1. CLI Tool (Quick Reviews)

Process a directory of images/videos into a PDF:

```bash
python scripts/process.py ./screenshots -o review.pdf
```

### 2. Library Modules (Composable Workflows)

Import and use in custom workflows like daily reports:

```python
from lib.pdf_components import add_screenshot_section

# Add to your existing PDF
add_screenshot_section(story, image_paths, max_width=5*inch)
```

## Quick Start

### Prerequisites

```bash
pip install Pillow reportlab

# Optional: for video thumbnails
brew install ffmpeg  # macOS
apt-get install ffmpeg  # Linux
```

### CLI Usage

```bash
# Basic review
python scripts/process.py ./images -o review.pdf

# Custom layout
python scripts/process.py ./inbox -o review.pdf \
  --width 600 \
  --per-page 2 \
  --annotation-height 100

# With metadata
python scripts/process.py ./screenshots -o review.pdf \
  --title "Bug Report" \
  --author "QA Team"
```

### Programmatic Usage

```python
from pathlib import Path
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate

from lib.pdf_components import (
    add_screenshot_section,
    create_title_page,
    get_default_styles
)

# Create your PDF
doc = SimpleDocTemplate("output.pdf")
story = []
styles = get_default_styles()

# Add title
title = create_title_page(
    title="Daily Review",
    metadata={"Items": 12}
)
story.extend(title)

# Add image section
inbox_images = list(Path("inbox").glob("*.png"))
add_screenshot_section(
    story,
    inbox_images,
    section_title="Items to Review",
    max_width=5*inch,
    annotation_height=100
)

doc.build(story)
```

## Library Modules

### `lib/image_processing.py`

Image and video thumbnail generation:

```python
from lib.image_processing import ImageProcessor

# Create thumbnail from image
img, width, height = ImageProcessor.create_thumbnail(
    Path("screenshot.png"),
    max_width=800
)

# Extract frame from video
frame_path = ImageProcessor.extract_video_frame(
    Path("recording.mp4"),
    timestamp="00:00:05"
)

# Check if file is video
if ImageProcessor.is_video_file(Path("file.mp4")):
    # Handle video
    pass
```

### `lib/pdf_components.py`

Reusable PDF building blocks:

```python
from lib.pdf_components import (
    create_annotation_box,
    create_screenshot_block,
    add_screenshot_section,
    create_title_page
)

# Create annotation space
annotation = create_annotation_box(
    width=6*inch,
    height=2*inch
)
story.append(annotation)

# Create single screenshot block
screenshot_elements = create_screenshot_block(
    Path("image.png"),
    max_width=5*inch,
    annotation_height=100,
    caption="Review this item"
)
story.extend(screenshot_elements)

# Add multiple screenshots as a section
add_screenshot_section(
    story,
    screenshot_paths,
    section_title="Screenshots",
    max_width=6*inch
)
```

## Example Workflows

### Morning Paper

See `examples/morning-paper.py` for a complete example of building a personalized daily review PDF that combines:

- Task lists
- Calendar events
- Inbox screenshots with annotation space
- Project updates

```python
from lib.pdf_components import add_screenshot_section, create_title_page

# Your morning report builder
story = []

# Add title
story.extend(create_title_page(
    title="Morning Review",
    subtitle=today.strftime("%A, %B %d, %Y"),
    metadata={"Tasks": 5, "Inbox": 3}
))

# Add inbox review section
inbox = list(Path("~/inbox").glob("*.png"))
add_screenshot_section(
    story,
    inbox,
    section_title="Inbox - Items Requiring Action",
    max_width=5*inch,
    annotation_height=120
)
```

### Bug Report Generator

```python
from lib.pdf_components import add_screenshot_section

# Collect screenshots
bug_screenshots = sorted(Path("./bug-123").glob("*.png"))

# Generate report
story = []
story.extend(create_title_page(
    title="Bug #123: Login Error",
    author="QA Team"
))

add_screenshot_section(
    story,
    bug_screenshots,
    section_title="Reproduction Steps",
    annotation_height=150,
    screenshots_per_page=1
)

doc.build(story)
```

## CLI Reference

```bash
python scripts/process.py INPUT_DIR [OPTIONS]
```

### Options

- `-o, --output FILE` - Output PDF (default: images-review.pdf)
- `--width PIXELS` - Max thumbnail width (default: 500)
- `--per-page N` - Images per page (default: 1)
- `--annotation-height PIXELS` - Annotation space height (default: 150)
- `--title TEXT` - Document title
- `--author TEXT` - Document author
- `--date TEXT` - Document date
- `--sort-by {name,date,size}` - Sort order (default: name)
- `--pattern GLOB` - File pattern (default: `*.png,*.jpg,*.jpeg`)
- `-v, --verbose` - Verbose output

## Supported Formats

### Images

- PNG, JPG, JPEG, GIF, BMP, TIFF, WebP

### Videos (with ffmpeg)

- MP4, MOV, AVI, MKV, WebM, FLV, M4V, WMV, MPG, MPEG

Videos are converted to thumbnail images automatically when ffmpeg is available.

## Integration Examples

### With Task Runners

Add to your `Justfile`:

```just
review-inbox:
    python ~/dot-agents/worktrees/main/skills/documents/image-review-pdf/scripts/process.py \
      ~/Desktop/inbox \
      -o ~/Desktop/inbox-review-{{date}}.pdf \
      --title "Inbox Review"
```

### With CI/CD

```yaml
- name: Generate Screenshot Report
  run: |
    python scripts/process.py ./screenshots \
      -o pr-${{ github.event.number }}-review.pdf \
      --title "PR #${{ github.event.number }} Screenshots"
```

### In Custom Scripts

```python
# daily-report.py
from datetime import datetime
from pathlib import Path
from lib.pdf_components import add_screenshot_section, create_title_page
from lib.image_processing import ImageProcessor

def generate_daily_report():
    story = []

    # Title page
    story.extend(create_title_page(
        title=f"Daily Report - {datetime.now().strftime('%Y-%m-%d')}"
    ))

    # Section 1: Screenshots
    screenshots = list(Path("~/work/screenshots").glob("*.png"))
    add_screenshot_section(
        story,
        screenshots,
        section_title="Screenshots to Review",
        max_width=5*inch
    )

    # Section 2: Videos (extract frames first)
    videos = list(Path("~/work/recordings").glob("*.mp4"))
    for video in videos:
        frame = ImageProcessor.extract_video_frame(video, "00:00:01")
        if frame:
            add_screenshot_section(
                story,
                [frame],
                section_title=f"Recording: {video.name}",
                max_width=4*inch
            )

    doc.build(story)
```

## Best Practices

1. **Use descriptive filenames** - Enables easy reference in annotations
2. **Number files for ordering** - `01-step.png`, `02-step.png`
3. **Adjust thumbnail size for use case**:
   - Detailed review: `max_width=6*inch`, 1 per page
   - Quick overview: `max_width=3*inch`, 2-4 per page
4. **Customize annotation space** - More space for detailed feedback, less for quick notes
5. **Compose workflows** - Import lib modules into larger systems

## Library API

### Image Processing

```python
from lib.image_processing import ImageProcessor

# Thumbnail creation
img, w, h = ImageProcessor.create_thumbnail(path, max_width=800)

# Video frame extraction
frame = ImageProcessor.extract_video_frame(video_path, "00:00:05")

# Check video
is_video = ImageProcessor.is_video_file(path)

# Image info
info = ImageProcessor.get_image_info(path)
# Returns: {width, height, format, mode, size_bytes, aspect_ratio}
```

### PDF Components

```python
from lib.pdf_components import (
    create_annotation_box,
    create_screenshot_block,
    add_screenshot_section,
    create_title_page,
    get_default_styles
)

# Get styles
styles = get_default_styles()
# Returns: {title, subtitle, metadata, filename, caption}

# Title page
elements = create_title_page(title, subtitle, author, date, metadata)

# Single screenshot
elements = create_screenshot_block(
    image_path,
    max_width=6*inch,
    annotation_height=150,
    caption="Optional caption"
)

# Screenshot section (modifies story in place)
add_screenshot_section(
    story,
    screenshot_paths,
    section_title="Title",
    max_width=6*inch,
    annotation_height=150,
    screenshots_per_page=1
)

# Annotation box
box = create_annotation_box(width, height)
```

## Troubleshooting

### Missing Dependencies

```bash
pip install Pillow reportlab
```

### Video Thumbnails Not Working

Install ffmpeg:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
apt-get install ffmpeg
```

### Import Errors in Custom Scripts

Ensure lib path is in Python path:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
```

## Resources

- Image processing: `lib/image_processing.py`
- PDF components: `lib/pdf_components.py`
- CLI script: `scripts/process.py`
- Example workflow: `examples/morning-paper.py`
